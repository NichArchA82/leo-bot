import { getLogger } from '../../../../logging/logger.js';
import getWatchPartySchema from '../../schemas/watch-party.schema.js';
import axios from 'axios';

export default async ({ eventArgs, handler }) => {
  const [message] = eventArgs;
  const watchPartySchema = getWatchPartySchema(handler);
  let document = await watchPartySchema.findOne({ channel: message.channel.id });
  if (!document) return;
  const eventId = document.eventId;
  const guildId = message.guild.id;
  const logger = getLogger(guildId, eventId);
  let member;

  try {
    logger.info(`--------------|[TASK START ]|-----------------`);
    const response = await axios.get(`https://raid-helper.dev/api/v2/events/${eventId}`);
    const data = response.data;
    const signups = data.signUps;


    const result = await watchPartySchema.aggregate([
      { $unwind: '$threads' },
      { $unwind: '$threads.users' },
      { $group: { _id: null, userIds: { $addToSet: '$threads.users.userId' } } },
      { $project: { _id: 0, userIds: 1 } }
  ]);
  
  console.log(result);
  if (result.length > 0) {
  
      for (const thread of document.threads) {
          for (const user of thread.users) {
              if (!signups.some(signup => signup.userId === user.userId)) {
                member = await message.guild.members.fetch(user.userId);
                const discordRole = await message.guild.roles.cache.get(document.role);
                if (member.roles.cache.has(discordRole.id)) {
                  await member.roles.remove(discordRole);
                }
                logger.info(`Removing user ${member.displayName} from thread ${thread.threadName} because they are no longer with that squad`);
                  // Pull user from database
                  await watchPartySchema.findOneAndUpdate(
                      { _id: `${message.guild.id}-${eventId}`, "threads.threadId": thread.threadId },
                      {
                          $pull: {
                              "threads.$.users": { userId: user.userId }
                          }
                      }
                  );
  
                  const threadChannel = await handler.client.channels.fetch(thread.threadId);
                  await threadChannel.members.remove(user.userId);
              }
          }
      }
  }
    for (const item of signups) {
      const { specName: role, className, userId } = item;
      if (userId.includes("-")) continue;
      try {
        member = await message.guild.members.fetch(userId);
        const discordRole = await message.guild.roles.cache.get(document.role);
        if (className === 'Tentative') {
          if (!member.roles.cache.has(discordRole.id)) {
            await member.roles.add(discordRole);
          }
        } else {
          if (member.roles.cache.has(discordRole.id)) {
            await member.roles.remove(discordRole);
          }
        }
      } catch {
        logger.error('Error fetching member or adding and removing roles: continuing');
        continue;
      }
      let threadExists = false;
      let userExists = false;

      // Re-fetch the document to ensure it's up-to-date
      document = await watchPartySchema.findOne({ channel: message.channel.id });

      for (const thread of document.threads) {    
        for (const user of thread.users) {
          if (user.userId === userId) {
            if (
              (thread.threadName !== className)
             ) {
              // Pull user from database
              logger.info(`Removing user ${member.displayName} from thread ${thread.threadName}`);
              await watchPartySchema.findOneAndUpdate(
                { _id: `${message.guild.id}-${eventId}`, "threads.threadId": thread.threadId },
                {
                  $pull: {
                    "threads.$.users": { userId }
                  }
                },
                { upsert: true }
              );
              const threadChannel = await handler.client.channels.fetch(thread.threadId);
              await threadChannel.members.remove(userId);
              userExists = false;
            } else {
              userExists = true;
            }
          }
        }

        if (thread.threadName === className) {
          threadExists = true;
          if (userExists === false) {
            logger.info(`adding user ${member.displayName} to thread ${thread.threadName}`);
            await watchPartySchema.findOneAndUpdate(
              { _id: `${message.guild.id}-${eventId}`, "threads.threadId": thread.threadId },
              {
                $push: {
                  "threads.$.users": { userId }
                }
              },
              { upsert: true }
            );
            const threadChannel = await handler.client.channels.fetch(thread.threadId);
            await threadChannel.members.add(userId);
          }
        }
      }
    }
    logger.info(`---------------|[TASK END ]|------------------`);
  } catch (error) {
    logger.error('Error in squad threads:', {error: error, stack: error.stack});
    logger.info(`---------------|[TASK END ]|------------------`);
  }
};
