import getWatchPartySchema from '../../schemas/watch-party.schema.js';
import logger from '../../util/logger.js';
import axios from 'axios';

const log = logger();

// --- Helper Functions ---

/**
 * Safely performs a Discord API action and updates the database only on success.
 * @param {Function} apiCall - The async Discord API function to call.
 * @param {Function} dbUpdateCall - The async Mongoose function to call if the API call succeeds.
 * @param {string} errorMessage - A message to log on failure.
 * @returns {boolean} - True if successful, false otherwise.
 */
const safeDiscordAction = async (apiCall, dbUpdateCall, errorMessage) => {
    try {
        await apiCall();
        if (dbUpdateCall) {
            await dbUpdateCall();
        }
        return true;
    } catch (error) {
        log.error(errorMessage, { error: error.message });
        // By not calling dbUpdateCall here, we prevent the database from getting into a bad state.
        // The script will re-attempt the action on its next run.
        return false;
    }
};

/**
 * Synchronizes the 'Tentative' role based on the latest signups.
 * Adds the role to new Tentative signups and removes it from users who are
 * no longer Tentative or have unregistered entirely.
 */
const syncTentativeRoles = async (signups, document, guild) => {
    const discordRole = await guild.roles.fetch(document.role, { force: true }).catch(() => null);
    if (!discordRole) {
        log.warn(`[WP] Tentative role ID not found in document or could not be fetched. Skipping role sync.`);
        return;
    }

    // Get the set of user IDs who SHOULD have the role according to the signups.
    const shouldHaveRole = new Set(
        signups
            .filter(s => s.className === 'Tentative')
            .map(s => s.userId)
    );

    // Get the set of user IDs who CURRENTLY have the role in Discord via the reliable role.members collection.
    const hasRole = new Set(discordRole.members.keys());

    // REMOVAL LOGIC: Find users who have the role but shouldn't.
    // (They are in 'hasRole' but NOT in 'shouldHaveRole')
    for (const memberId of hasRole) {
        if (!shouldHaveRole.has(memberId)) {
            const member = await guild.members.fetch(memberId).catch(() => null);
            if (member) {
                log.info(`[WP] Removing Tentative role from ${member.id}. Reason: No longer signed up as Tentative.`);
                await safeDiscordAction(
                    () => member.roles.remove(discordRole),
                    null,
                    `[WP] Failed to remove role from ${member.id} during sync.`
                );
            }
        }
    }

    // ADDITION LOGIC: Find users who should have the role but don't.
    // (They are in 'shouldHaveRole' but NOT in 'hasRole')
    for (const memberId of shouldHaveRole) {
        if (!hasRole.has(memberId)) {
            const member = await guild.members.fetch(memberId).catch(() => null);
            if (member) {
                log.info(`[WP] Adding Tentative role to ${member.id}.`);
                await safeDiscordAction(
                    () => member.roles.add(discordRole),
                    null,
                    `[WP] Failed to add role to ${member.id} during sync.`
                );
            }
        }
    }
};


/**
 * Removes users from THREADS if they are no longer signed up for the event.
 * This function no longer manages roles.
 */
const syncRemovedUsers = async (document, signups, guild, handler, watchPartySchema) => {
    const dbUserIds = new Set(document.threads.flatMap(t => t.users.map(u => u.userId)));
    const signupUserIds = new Set(signups.map(s => s.userId));

    for (const userId of dbUserIds) {
        if (!signupUserIds.has(userId)) {
            // User is in our DB threads but not in the Raid-Helper signups, so remove them.
            log.info(`[WP] User ${userId} no longer signed up. Removing from all threads.`);
            const member = await guild.members.fetch(userId).catch(() => null);

            // Remove from all associated threads in Discord
            for (const thread of document.threads) {
                if (thread.users.some(u => u.userId === userId)) {
                    const threadChannel = await handler.client.channels.fetch(thread.threadId).catch(() => null);
                    if (threadChannel && member) {
                        await safeDiscordAction(
                            () => threadChannel.members.remove(userId),
                            null, // DB update is handled in bulk below
                            `[WP] Failed to remove ${userId} from thread ${thread.threadId}`
                        );
                    }
                }
            }
            
            // Pull user from all threads in the database in one operation
            await watchPartySchema.updateMany(
                { _id: document._id },
                { $pull: { "threads.$[].users": { userId: userId } } }
            );
        }
    }
};

/**
 * Removes a user from any threads that do not match their current signup.
 */
const removeUserFromOldThreads = async (userId, newClassName, document, handler, watchPartySchema) => {
    for (const thread of document.threads) {
        if (thread.users.some(u => u.userId === userId)) {
            // In this simpler setup, a user should only be in the thread that matches their className.
            if (thread.threadName !== newClassName) {
                log.info(`[WP] Moving user ${userId} from old thread ${thread.threadName}.`);
                const threadChannel = await handler.client.channels.fetch(thread.threadId).catch(() => null);
                if (threadChannel) {
                    await safeDiscordAction(
                        () => threadChannel.members.remove(userId),
                        () => watchPartySchema.findOneAndUpdate(
                            { _id: document._id, "threads.threadId": thread.threadId },
                            { $pull: { "threads.$.users": { userId } } }
                        ),
                        `[WP] Failed to remove ${userId} from old thread ${thread.threadId}`
                    );
                }
            }
        }
    }
};

/**
 * Adds a user to the thread appropriate for their signup.
 */
const addUserToCorrectThread = async (userId, className, document, handler, watchPartySchema, message) => {
    // Only create threads for specific, non-utility roles
    if (['Bench', 'Late', 'Tentative', 'Absence'].includes(className)) {
        return;
    }

    let thread = document.threads.find(t => t.threadName === className);

    // Create the thread if it doesn't exist
    if (!thread) {
        try {
            const threadChannel = await message.channel.threads.create({
                name: className,
                type: ChannelType.PrivateThread,
                invitable: true,
                autoArchiveDuration: 10080,
            });
            log.info(`[WP] Created new thread ${className} (${threadChannel.id}) for user ${userId}.`);
            
            await safeDiscordAction(
                () => threadChannel.members.add(userId),
                () => watchPartySchema.updateOne(
                    { _id: document._id },
                    { $push: { threads: { threadId: threadChannel.id, threadName: className, users: [{ userId }] } } },
                    { upsert: true }
                ),
                `[WP] Failed to add ${userId} to newly created thread ${className}`
            );
            // After creation, update the local document state to prevent re-creation in the same run
            document.threads.push({ threadId: threadChannel.id, threadName: className, users: [{ userId }] });

        } catch (error) {
            log.error(`[WP] Fatal error creating thread ${className}`, { error });
        }
        return; // Exit after creating and adding
    }

    // Add user to the existing thread if they aren't already in it
    if (thread && !thread.users.some(u => u.userId === userId)) {
        log.info(`[WP] Adding user ${userId} to existing thread ${className}.`);
        const threadChannel = await handler.client.channels.fetch(thread.threadId).catch(() => null);
        if(threadChannel) {
            await safeDiscordAction(
                () => threadChannel.members.add(userId),
                () => watchPartySchema.updateOne(
                    { _id: document._ed, "threads.threadId": thread.threadId },
                    { $push: { "threads.$.users": { userId } } }
                ),
                `[WP] Failed to add ${userId} to thread ${thread.threadId}`
            );
        }
    }
};


// --- Main Handler ---

export default async ({ eventArgs, handler }) => {
    const [message] = eventArgs;
    const watchPartySchema = getWatchPartySchema(handler);
    let document = await watchPartySchema.findOne({ channel: message.channel.id });

    if (!document) return;

    try {
        const response = await axios.get(`https://raid-helper.dev/api/v2/events/${document.eventId}`);
        const signups = response.data.signUps;

        // Synchronize the Tentative role for all relevant users.
        await syncTentativeRoles(signups, document, message.guild);

        // Synchronize thread membership for users who have unregistered.
        await syncRemovedUsers(document, signups, message.guild, handler, watchPartySchema);

        // Loop through current signups to manage thread membership changes.
        for (const signup of signups) {
            if (signup.userId.includes("-")) continue; // Skip anonymous signups

            // Re-fetch the document inside the loop to get the latest state.
            document = await watchPartySchema.findOne({ _id: document._id });

            const member = await message.guild.members.fetch(signup.userId).catch(() => null);
            if (!member) {
                log.warn(`[WP] Could not fetch member with ID ${signup.userId}. Skipping.`);
                continue;
            }
            
            // Remove user from any threads that are now incorrect for their signup.
            await removeUserFromOldThreads(signup.userId, signup.className, document, handler, watchPartySchema);
           
            // Add user to the correct thread for their new signup.
            const currentDocState = await watchPartySchema.findOne({ _id: document._id });
            await addUserToCorrectThread(signup.userId, signup.className, currentDocState, handler, watchPartySchema, message);
        }

    } catch (error) {
        log.error('Major error during Watch Party sync process:', { error: error, stack: error.stack });
    }
};
