import { getLogger } from '../../../../logging/logger.js';
import { ChannelType } from 'discord.js';
import getOperationsSchema from '../../schemas/operations.schema.js';
import axios from 'axios';

// Function to handle the message event
export default async (message, _, handler) => {
  const operationsSchema = getOperationsSchema(handler);
  let document = await operationsSchema.findOne({ channel: message.channel.id });
  if (!document) return; // Exit if no document is found
  const eventId = document.eventId;
  const guildId = message.guild.id;
  const logger = getLogger(guildId, eventId);

  try {
    logger.info(`--------------|[TASK START ]|-----------------`);

    // Fetch sign-ups from external API
    const response = await axios.get(`https://raid-helper.dev/api/v2/events/${eventId}`);
    const signups = response.data.signUps;

    // Get existing user IDs in threads from the database
    const existingUserIdsResult = await operationsSchema.aggregate([
      { $unwind: '$threads' },
      { $unwind: '$threads.users' },
      { $group: { _id: null, userIds: { $addToSet: '$threads.users.userId' } } },
      { $project: { _id: 0, userIds: 1 } }
    ]);

    const existingUserIds = existingUserIdsResult.length > 0 ? existingUserIdsResult[0].userIds : [];

    // Remove users who are no longer signed up from threads
    for (const thread of document.threads) {
      for (const user of thread.users) {
        if (!signups.some(signup => signup.userId === user.userId)) {
          const member = await message.guild.members.fetch(user.userId);
          logger.info(`Removing user ${member.displayName} from thread ${thread.threadName} because they are no longer with that squad`);
          
          // Remove user from the thread in the database and on Discord
          await operationsSchema.updateOne(
            { _id: `${guildId}-${eventId}`, "threads.threadId": thread.threadId },
            { $pull: { "threads.$.users": { userId: user.userId } } }
          );

          const threadChannel = await handler.client.channels.fetch(thread.threadId);
          await threadChannel.members.remove(user.userId);
        }
      }
    }

    // Add users to the appropriate threads
    for (const item of signups) {
      const { specName: role, className, userId } = item;
      if (userId.includes("-")) continue; // Skip invalid user IDs

      const member = await message.guild.members.fetch(userId);

      // Re-fetch the document to ensure it's up-to-date
      document = await operationsSchema.findOne({ channel: message.channel.id });

      let threadExists = false;
      let userExists = existingUserIds.includes(userId);

      for (const thread of document.threads) {
        // Determine if the user should be removed based on class and role
        const shouldRemoveUser = 
          (thread.threadName !== className && thread.threadName !== 'Command' && thread.threadName !== 'COMMS') || 
          (thread.threadName === 'COMMS' && className === 'Absence') || 
          (thread.threadName === 'Command' && ['Soldier', 'Sniper', 'Tank_Crewman'].includes(role) || ['Bench', 'Late', 'Tentative', 'Absence'].includes(className));

        if (userExists && shouldRemoveUser) {
          logger.info(`Removing user ${member.displayName} from thread ${thread.threadName}`);
          
          // Remove user from the thread in the database and on Discord
          await operationsSchema.updateOne(
            { _id: `${guildId}-${eventId}`, "threads.threadId": thread.threadId },
            { $pull: { "threads.$.users": { userId } } }
          );
          const threadChannel = await handler.client.channels.fetch(thread.threadId);
          await threadChannel.members.remove(userId);
          userExists = false;
        }

        // Add user to the appropriate thread
        if (thread.threadName === className || 
          (thread.threadName === 'Command' && !(['Soldier', 'Sniper', 'Tank_Crewman'].includes(role) || ['Bench', 'Late', 'Tentative', 'Absence'].includes(className))) || 
          (thread.threadName === 'COMMS' && className !== 'Absence')) {
          threadExists = true;
          if (!userExists) {
            logger.info(`Adding user ${member.displayName} to thread ${thread.threadName}`);
            
            // Add user to the thread in the database and on Discord
            await operationsSchema.updateOne(
              { _id: `${guildId}-${eventId}`, "threads.threadId": thread.threadId },
              { $push: { "threads.$.users": { userId } } },
              { upsert: true }
            );
            const threadChannel = await handler.client.channels.fetch(thread.threadId);
            await threadChannel.members.add(userId);
          }
        }

        // Delete the thread if it's empty and not a special thread
        if (!thread.users.length && thread.threadName !== 'Command' && thread.threadName !== 'COMMS') {
          logger.info(`Removing thread ${thread.threadName} because all users have left`);
          const threadChannel = await handler.client.channels.fetch(thread.threadId);
          await threadChannel.delete();
          await operationsSchema.updateOne(
            { _id: `${guildId}-${eventId}` },
            { $pull: { threads: { threadId: thread.threadId } } }
          );
        }
      }

      // Create a new thread if it doesn't exist
      if (!threadExists && !['Commander', 'Bench', 'Late', 'Tentative', 'Absence'].includes(className)) {
        try {
          logger.info(`Creating new thread ${className}`);
          const threadChannel = await message.channel.threads.create({
            name: `${className}`,
            type: ChannelType.PrivateThread,
            invitable: true,
            autoArchiveDuration: 10080,
          });

          await operationsSchema.updateOne(
            { _id: `${guildId}-${eventId}` },
            { $push: { threads: { threadId: threadChannel.id, threadName: className, users: [{ userId }] } } },
            { upsert: true }
          );

          await threadChannel.members.add(userId);
          logger.info(`Added user ${member.displayName} to new thread ${className}`);
        } catch (error) {
          logger.error('Error creating thread:', error);
        }
      }
    }

    logger.info(`---------------|[TASK END ]|------------------`);
  } catch (error) {
    logger.error('Error in squad threads:', error);
    logger.info(`---------------|[TASK END ]|------------------`);
  }
};
