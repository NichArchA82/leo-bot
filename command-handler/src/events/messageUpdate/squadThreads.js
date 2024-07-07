import { ChannelType } from 'discord.js';
import getOperationsSchema from '../../schemas/operations.schema.js';
import axios from 'axios';

// const delay = (ms) => {
//   return new Promise(resolve => setTimeout(resolve, ms));
// };

export default async (message, _, handler) => { //oldMessage, newMessage, commandHandler
  // await delay(10000); // Wait for 2 seconds
  const operationsSchema = getOperationsSchema(handler);
  let document = await operationsSchema.findOne({ channel: message.channel.id });
  if (!document) return;

  try {
    const eventId = document.eventId;
    const response = await axios.get(`https://raid-helper.dev/api/v2/events/${eventId}`);
    const data = response.data;
    const signups = data.signUps;


    const result = await operationsSchema.aggregate([
      { $unwind: '$threads' },
      { $unwind: '$threads.users' },
      { $group: { _id: null, userIds: { $addToSet: '$threads.users.userId' } } },
      { $project: { _id: 0, userIds: 1 } }
  ]);
  
  if (result.length > 0) {
  
      for (const thread of document.threads) {
          for (const user of thread.users) {
              if (!signups.some(signup => signup.userId === user.userId)) {
                  // Pull user from database
                  await operationsSchema.findOneAndUpdate(
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
      const role = item.specName;
      const className = item.className;
      const userId = item.userId;
      let threadExists = false;
      let userExists = false;

      // Re-fetch the document to ensure it's up-to-date
      document = await operationsSchema.findOne({ channel: message.channel.id });

      for (const thread of document.threads) {      
        for (const user of thread.users) {
          if (user.userId === userId) {
            if ((thread.threadName !== className && thread.threadName !== 'Command' && thread.threadName!== 'COMMS') || (thread.threadName === 'Command' && (role === 'Soldier' || role === 'Sniper' || role === 'Tank_Crewman' || className === 'Bench' || className === 'Late' || className === 'Tentative' || className === 'Absence'))) {
              // Pull user from database
              await operationsSchema.findOneAndUpdate(
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
            await operationsSchema.findOneAndUpdate(
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

        if (thread.threadName === 'Command' && (role !== 'Soldier' && role !== 'Sniper' && role === 'Tank_Crewman' && className !== 'Late' && className !== 'Bench' && className !== 'Tentative' && className !== 'Absence')) {
          if (userExists === false) {
            await operationsSchema.findOneAndUpdate(
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

          if (thread.threadName === 'COMMS' && (className !== 'Absence' && className !== 'Tentative')) {
            if (userExists === false) {
              await operationsSchema.findOneAndUpdate(
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

        if (!thread.users.length && thread.threadName !== 'Command' && thread.threadName !== 'COMMS') {
          const threadChannel = await handler.client.channels.fetch(thread.threadId);
          await threadChannel.delete();
          await operationsSchema.findOneAndUpdate(
            { _id: `${message.guild.id}-${eventId}` },
            {
              $pull: {
                threads: { threadId: thread.threadId }
              }
            },
            { new: true }
          );
        }
      }

      if (threadExists === false && className !== 'Commander' && className !== 'Bench' && className !== 'Late' && className !== 'Tentative' && className !== 'Absence') {
        try {
          const threadChannel = await message.channel.threads.create({
            name: `${className}`,
            type: ChannelType.PrivateThread,
            invitable: true, // Allows anyone in the thread to invite others
            autoArchiveDuration: 10080, // Sets auto-archive duration to 1 week
          });

          await operationsSchema.updateOne(
            { _id: `${message.guild.id}-${eventId}` },
            {
              $push: {
                threads: {
                  threadId: threadChannel.id,
                  threadName: className,
                  users: [{ userId }]
                }
              }
            },
            { upsert: true }
          );

          // Add users to the thread
          await threadChannel.members.add(userId);
        } catch (error) {
          console.error('Error creating thread:', error);
        }
      }
    }
  } catch (error) {
    console.error('Error fetching data:', error);
  }
};