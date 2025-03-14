/*
This task is responsible for checking the recruit messages in the database 
and sending a message to the RO channel if the recruit has received all their signoffs.
*/

import getRecruitMessagesSchema from 'command-handler/src/schemas/recruit-messages-schema.js';
import logger from 'command-handler/src/util/logger.js';
import 'dotenv/config';

export default async (client, handler) => {
    // Get the schema for the recruit messages
    const recruitMessagesSchema = getRecruitMessagesSchema(handler);
    // Get the current date
    const currentDate = new Date();
    // Find the document for the guild that the event is running in
    const document = await recruitMessagesSchema.findOne({ _id: process.env.EVENT_GUILDS });
    //return if the document doesn't exist
    if (!document) return;
    // Define the channels to be used in the task
    let evalBoardChannel, roChannel; //roChannel is the recruit-office channel
    let message;
    let recruitMember;

    // Try to fetch the evalBoardChannel
    try {
        evalBoardChannel = await client.channels.fetch(document.evalChannel);
    } catch (error) {
        log.error('Error fetching evalBoardChannel', error);
    }

    // Try to fetch the roChannel
    if (document.roChannel) {
        roChannel = client.channels.cache.get(document.roChannel);
        if (!roChannel) {
            try {
                roChannel = await client.channels.fetch(document.roChannel);
            } catch (error) {
                log.error('Error fetching roChannel', error);
                
            }
        }
    }

    //check if the comparisons have expired and remove them
    //This is set to 60 days then the comparison is removed
    for (const member of document.comparisons) {
        if (currentDate > member.removeDate) {
            await recruitMessagesSchema.findOneAndUpdate({
                _id: process.env.EVENT_GUILDS
            }, {
                $pull: {
                    comparisons: {
                        memberId: member.memberId
                    }
                }
            })
        }
    }

    // Set the time to 00:00:00.000 UTC
    currentDate.setUTCHours(0, 0, 0, 0); // Set time to 00:00:00.000 UTC

    // Filter eval messages to only include those that have exceeded their minimum eval period
    const filteredEvalMessages = document.evalMessages.filter(evalMessage => {
        return new Date(evalMessage.minEvalDate) <= currentDate;
    });

    for (const msg of filteredEvalMessages) {
        try {
            message = await evalBoardChannel.messages.fetch(msg.messageId);
        } catch {
            // If the message does not exist, remove it from the evalMessages array in the database
            // and continue to the next message
            await recruitMessagesSchema.findOneAndUpdate({
                _id: process.env.EVENT_GUILDS
            }, {
                $pull: {
                    evalMessages: {
                        messageId: msg.messageId
                    }
                }
            });
            continue;
        }

        // Get the reactions from the message
        const reactions = message.reactions.cache;

        // Fetch the member object from the recruit ID
        try {
            recruitMember = await message.guild.members.fetch(msg.recruitId);
        } catch (error) {
            continue;
        }

        // Get the number of checks and concerns
        const checks = reactions.get('✅')?.count || 0;
        const concerns = reactions.get('❌')?.count || 0;

        // If the recruit has received all their signoffs, send a message to the RO channel
        if ((checks >= 8 && msg.sponsorId !== 'None') || (checks >= 10 && msg.sponsorId === 'None')) {
            roChannel.send({
                content: `Recruit "${recruitMember}" received all their signoffs ( https://discord.com/channels/${message.guild.id}/${message.channelId}/${message.id} )`,
                allowedMentions: {
                    roles: [],
                    users: [],
                },
            });
        }
    }
}