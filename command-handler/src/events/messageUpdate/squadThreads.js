import { ChannelType } from 'discord.js';
import getOperationsSchema from '../../schemas/operations.schema.js';
import logger from '../../util/logger.js';
import axios from 'axios';

const log = logger();

// --- Helper Functions ---

/**
 * Safely performs a Discord API action and updates the database only on success.
 * @param {Function} apiCall - The async Discord API function to call (e.g., () => thread.members.add(userId)).
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
 * Removes users from threads and roles if they are no longer signed up for the event.
 */
const syncRemovedUsers = async (document, signups, guild, handler, operationsSchema) => {
    const dbUserIds = new Set(document.threads.flatMap(t => t.users.map(u => u.userId)));
    const signupUserIds = new Set(signups.map(s => s.userId));
    const discordRole = await guild.roles.cache.get(document.role);

    for (const userId of dbUserIds) {
        if (!signupUserIds.has(userId)) {
            // User is in our DB but not in the Raid-Helper signups, so remove them.
            log.info(`User ${userId} no longer signed up. Removing from all threads and roles.`);
            const member = await guild.members.fetch(userId).catch(() => null);

            // Remove from all associated threads
            for (const thread of document.threads) {
                if (thread.users.some(u => u.userId === userId)) {
                    const threadChannel = await handler.client.channels.fetch(thread.threadId).catch(() => null);
                    if (threadChannel && member) {
                        await safeDiscordAction(
                            () => threadChannel.members.remove(userId),
                            null, // DB update is handled in bulk below
                            `Failed to remove ${userId} from thread ${thread.threadId}`
                        );
                    }
                }
            }

            // Remove role if they have it
            if (member && discordRole && member.roles.cache.has(discordRole.id)) {
                await safeDiscordAction(
                    () => member.roles.remove(discordRole),
                    null, // DB update is handled in bulk below
                    `Failed to remove role from ${userId}`
                );
            }
             // Pull user from all threads in the database in one operation
            await operationsSchema.updateMany(
                { _id: document._id },
                { $pull: { "threads.$[].users": { userId: userId } } }
            );
        }
    }
};


/**
 * Manages adding/removing the 'Tentative' role for a user based on their signup class.
 */
const manageTentativeRole = async (signup, member, document, guild) => {
    const discordRole = await guild.roles.cache.get(document.role);
    if (!discordRole) return;

    if (signup.className === 'Tentative') {
        if (!member.roles.cache.has(discordRole.id)) {
            await safeDiscordAction(
                () => member.roles.add(discordRole),
                null,
                `Failed to add Tentative role to ${member.id}`
            );
        }
    } else {
        if (member.roles.cache.has(discordRole.id)) {
             await safeDiscordAction(
                () => member.roles.remove(discordRole),
                null,
                `Failed to remove Tentative role from ${member.id}`
            );
        }
    }
};

/**
 * Removes a user from any threads that do not match their current signup.
 * This is key to allowing users to be moved from 'Tentative' to a role thread.
 */
const removeUserFromOldThreads = async (userId, newClassName, newRole, document, handler, operationsSchema) => {
    const isCommanderRole = !(['Soldier', 'Sniper', 'Tank_Crewman'].includes(newRole) || ['Bench', 'Late', 'Tentative', 'Absence'].includes(newClassName));
    const isAbsence = newClassName === 'Absence';
    
    for (const thread of document.threads) {
        if (thread.users.some(u => u.userId === userId)) {
            let shouldBeInThread = false;
            // Determine if the user should remain in this thread based on their new signup
            if (thread.threadName === newClassName) shouldBeInThread = true;
            if (thread.threadName === 'Command' && isCommanderRole) shouldBeInThread = true;
            if (thread.threadName === 'COMMS' && !isAbsence) shouldBeInThread = true;

            if (!shouldBeInThread) {
                // If the user is in this thread but shouldn't be, remove them.
                log.info(`Moving user ${userId} from old thread ${thread.threadName}.`);
                const threadChannel = await handler.client.channels.fetch(thread.threadId).catch(() => null);
                await safeDiscordAction(
                    () => threadChannel.members.remove(userId),
                    () => operationsSchema.findOneAndUpdate(
                        { _id: document._id, "threads.threadId": thread.threadId },
                        { $pull: { "threads.$.users": { userId } } }
                    ),
                    `Failed to remove ${userId} from old thread ${thread.threadId}`
                );
            }
        }
    }
};


/**
 * Adds a user to all threads appropriate for their signup.
 */
const addUserToCorrectThreads = async (userId, className, role, document, handler, operationsSchema, message) => {
    const isCommanderRole = !(['Soldier', 'Sniper', 'Tank_Crewman'].includes(role) || ['Bench', 'Late', 'Tentative', 'Absence'].includes(className));

    // Define which threads this user should be in
    const targetThreads = [];
    if (!['Commander', 'Bench', 'Late', 'Tentative', 'Absence'].includes(className)) {
        targetThreads.push(className);
    }
    if (isCommanderRole) {
        targetThreads.push('Command');
    }
    if (className !== 'Absence') {
        targetThreads.push('COMMS');
    }

    for (const threadName of targetThreads) {
        let thread = document.threads.find(t => t.threadName === threadName);

        // Create the thread if it doesn't exist
        if (!thread && !['Command', 'COMMS'].includes(threadName)) {
             try {
                const threadChannel = await message.channel.threads.create({
                    name: threadName,
                    type: ChannelType.PrivateThread,
                    invitable: true,
                    autoArchiveDuration: 10080,
                });
                log.info(`Created new thread ${threadName} (${threadChannel.id}) for user ${userId}.`);
                // Add the user and update the DB
                await safeDiscordAction(
                    () => threadChannel.members.add(userId),
                    () => operationsSchema.updateOne(
                        { _id: document._id },
                        { $push: { threads: { threadId: threadChannel.id, threadName, users: [{ userId }] } } },
                        { upsert: true }
                    ),
                    `Failed to add ${userId} to newly created thread ${threadName}`
                );
                // After creation, update the local document state to prevent re-creation
                document.threads.push({ threadId: threadChannel.id, threadName, users: [{userId}] });

             } catch (error) {
                 log.error(`Fatal error creating thread ${threadName}`, { error });
             }
            continue; // Move to the next target thread
        }

        // Add user to the existing thread if they aren't already in it
        if (thread && !thread.users.some(u => u.userId === userId)) {
            log.info(`Adding user ${userId} to existing thread ${threadName}.`);
            const threadChannel = await handler.client.channels.fetch(thread.threadId).catch(() => null);
            await safeDiscordAction(
                () => threadChannel.members.add(userId),
                () => operationsSchema.updateOne(
                    { _id: document._id, "threads.threadId": thread.threadId },
                    { $push: { "threads.$.users": { userId } } }
                ),
                `Failed to add ${userId} to thread ${thread.threadId}`
            );
        }
    }
};

/**
 * Finds and deletes any role-specific threads that are now empty.
 */
const cleanupEmptyThreads = async (document, handler, operationsSchema) => {
    // Re-fetch the document to get the most current state after all updates
    const freshDocument = await operationsSchema.findOne({_id: document._id});

    for (const thread of freshDocument.threads) {
        if (thread.users.length === 0 && !['Command', 'COMMS'].includes(thread.threadName)) {
            log.info(`Deleting empty thread ${thread.threadName} (${thread.threadId}).`);
            const threadChannel = await handler.client.channels.fetch(thread.threadId).catch(() => null);
            await safeDiscordAction(
                () => threadChannel.delete(),
                () => operationsSchema.updateOne(
                    { _id: document._id },
                    { $pull: { threads: { threadId: thread.threadId } } }
                ),
                `Failed to delete empty thread ${thread.threadId}`
            );
        }
    }
};


// --- Main Handler ---

export default async ({ eventArgs, handler }) => {
    const [message] = eventArgs;
    const operationsSchema = getOperationsSchema(handler);
    let document = await operationsSchema.findOne({ channel: message.channel.id });

    if (!document) return;

    try {
        const response = await axios.get(`https://raid-helper.dev/api/v2/events/${document.eventId}`);
        const signups = response.data.signUps;
        
        // Synchronize users who have been removed from the signup
        await syncRemovedUsers(document, signups, message.guild, handler, operationsSchema);

        for (const signup of signups) {
            if (signup.userId.includes("-")) continue; // Skip anonymous signups

            // Re-fetch the document inside the loop to get the latest state after potential removals/moves.
            document = await operationsSchema.findOne({ _id: document._id });

            const member = await message.guild.members.fetch(signup.userId).catch(() => null);
            if (!member) {
                log.warn(`Could not fetch member with ID ${signup.userId}. Skipping.`);
                continue;
            }

            // Manage the 'Tentative' role
            await manageTentativeRole(signup, member, document, message.guild);
            
            // Remove user from any threads that are now incorrect for their signup
            await removeUserFromOldThreads(signup.userId, signup.className, signup.specName, document, handler, operationsSchema);
           
            // Add user to all threads that are correct for their signup
            // Re-fetch document again after removals to ensure we have the absolute latest state before adding.
            const currentDocState = await operationsSchema.findOne({ _id: document._id });
            await addUserToCorrectThreads(signup.userId, signup.className, signup.specName, currentDocState, handler, operationsSchema, message);
        }
        
        await cleanupEmptyThreads(document, handler, operationsSchema);

    } catch (error) {
        log.error('Major error during operation sync process:', { error: error, stack: error.stack });
    }
};
