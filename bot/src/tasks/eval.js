/*
    Eval task to check if NRECs have exceeded their minimum eval period.
    If they have, the task will send a message to the eval message channel with the status of each NREC.
*/

import getRecruitMessagesSchema from 'command-handler/src/schemas/recruit-messages-schema.js';
import 'dotenv/config';
import { EmbedBuilder } from 'discord.js';
import logger from 'command-handler/src/util/logger.js';

const log = logger();

export default async (client, handler) => {
    // Get the schema for the recruit messages
    const recruitMessagesSchema = getRecruitMessagesSchema(handler);
    // Get the current date
    const currentDate = new Date();
    // Find the document for the event guilds
    let document = await recruitMessagesSchema.findOne({ _id: process.env.EVENT_GUILDS });
    // Initialize the status message to an empty string. This will be used to store the status of each NREC.
    let statusMsg = "";
    // Initialize the last message ID to null. This will be used to fetch messages to delete.
    let lastMessageId = null;
    // Initialize an array to store messages to delete.
    let messagesToDelete = [];
    // Define the channels to be used in the task
    let evalBoardChannel, evalMsgChannel, roChannel;
    // Check if the document exists and has evalMsgChannel
    if (!document || !document.evalMsgChannel?.length) return;

    try {
        evalBoardChannel = await client.channels.fetch(document.evalChannel);
        evalMsgChannel = await client.channels.fetch(document.evalMsgChannel);
        roChannel = await client.channels.fetch(document.roChannel);
    } catch (error) {
        log.error('Error fetching channels', error);
        return;
    }

    
    // Set the time to 00:00:00.000 UTC
    currentDate.setUTCHours(0, 0, 0, 0); // Set time to 00:00:00.000 UTC

    // Filter eval messages to only include those that have exceeded their minimum eval period
    const filteredEvalMessages = document.evalMessages.filter(evalMessage => {
        return new Date(evalMessage.minEvalDate) <= currentDate;
    });

    // Iterate through the filtered eval messages
    for (const msg of filteredEvalMessages) {
        //create a new date object from the minEvalDate string
        const minEvalDate = new Date(msg.minEvalDate);
        // Fetch the message from the eval board channel
        let message;
        let recruitMember, sponsorMember;
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
        } catch {
            // If the member does not exist, send a message to the RO channel and continue to the next message
            await roChannel.send({
                content: `Invalid Recruit found in message https://discord.com/channels/${message.guild.id}/${message.channelId}/${message.id}`
            });
            continue;  
        }

        // Set the number of signoffs required based on whether the recruit has a sponsor
        const signoffs = msg.sponsorId === 'None' ? 10 : 8;

        if (msg.sponsorId === 'None') {
            sponsorMember = 'None';
        } else {
            try {
                sponsorMember = await message.guild.members.fetch(msg.sponsorId);
            } catch {
                // If the sponsor does not exist, send a message to the RO channel and continue to the next message
                await roChannel.send({
                    content: `Invalid Sponsor found in message https://discord.com/channels/${message.guild.id}/${message.channelId}/${message.id}`
                });
                continue;
            }
        }

        // Get the number of check and concern reactions
        const checks = reactions.get('✅')?.count || 0;
        const concerns = reactions.get('❌')?.count || 0;

        //If the recruit has not met the required number of signoffs, add them to the status message
        statusMsg += `Recruit - ${recruitMember.displayName}\n`;
        //If the recruit has a sponsor, add the sponsor to the status message or add 'None' if the sponsor does not exist
        statusMsg += `Sponsor - ${sponsorMember.displayName ? sponsorMember.displayName : 'None'}\n`;
        //create a unix timestamp from the minEvalDate
        const unixTimeStamp = Math.floor(minEvalDate.getTime() / 1000);
        //add the minEvalDate to the status message relative to the current date
        statusMsg += `Min Eval Date ended <t:${unixTimeStamp}:R>\n`;
        statusMsg += `${checks}/${signoffs} signoffs achieved\n\n`;
    }

    // All other NRECs are within their minimum eval period
    if (statusMsg.length) {
        statusMsg += "All other NRECs are within their minimum eval period :thumbsup:";
    } else {
        statusMsg = "All NRECs are within their minimum eval period :thumbsup:";
    }

    // Fetch old messages to delete
    while (true) {
        const options = { limit: 100 };
        if (lastMessageId) {
            options.before = lastMessageId;
        }

        const fetchedMessages = await evalMsgChannel.messages.fetch(options);

        if (fetchedMessages.size === 0) break;

        fetchedMessages.forEach(msg => {
            const messageDate = new Date(msg.createdTimestamp);
            if (!msg.pinned && messageDate < currentDate) {
                messagesToDelete.push(msg);
            }
        });

        lastMessageId = fetchedMessages.last().id;

        if (fetchedMessages.size < 100) break;
    }

    // Delete messages
    for (const msg of messagesToDelete) {
        try {
            await msg.delete();
        } catch (error) {
            console.error(`Could not delete message with ID: ${msg.id}`, error);
        }
    }

    // Check if the evalStatus message exists 
    if (document.evalStatus?.length) {
        try {
            await evalMsgChannel.messages.fetch(document.evalStatus);
        } catch {
            // If the message does not exist, set evalStatus to an empty string
            await recruitMessagesSchema.findOneAndUpdate({
                _id: process.env.EVENT_GUILDS,
            }, {
                $set: {
                    _id: process.env.EVENT_GUILDS,
                    evalStatus: ""
                }
            }, {
                upsert: true,
            });
            // Fetch the updated document
            document = await recruitMessagesSchema.findOne({ _id: process.env.EVENT_GUILDS });
        }
    }

    // Create embeds for the status message
    const createEmbeds = (content) => {
        const chunks = [];
        for (let i = 0; i < content.length; i += 4096) {
            chunks.push(content.slice(i, i + 4096));
        }

        return chunks.map(chunk => new EmbedBuilder().setDescription(chunk).setColor('#0099ff'));
    }

    // Send or update the evalStatus message
    const sendOrUpdateMessage = async (embeds) => {
        // Check if the evalStatus message exists and update it with the new status message
        if (document.evalStatus?.length) {
            const evalStatusMsg = await evalMsgChannel.messages.fetch(document.evalStatus);
            await evalStatusMsg.edit({ embeds }).catch(console.error);
        } else {
            // If the evalStatus message does not exist, send a new message and pin it
            const evalStatusMsg = await evalMsgChannel.send({ embeds }).catch(console.error);
            await evalStatusMsg.pin();

            // Update the document in the database with the new evalStatus message ID
            await recruitMessagesSchema.findOneAndUpdate(
                { _id: process.env.EVENT_GUILDS },
                { $set: { _id: process.env.EVENT_GUILDS, evalStatus: evalStatusMsg.id } },
                { upsert: true }
            );
        }
    }

    // Send the status message to the eval message channel
    const embeds = createEmbeds(statusMsg);
    await sendOrUpdateMessage(embeds);

    // Send a message to the eval message channel to notify that the eval message has been updated
    const guild = await client.guilds.fetch(process.env.EVENT_GUILDS);
    const role = guild.roles.cache.find(role => role.name === 'Recruiting Specialist');
    await evalMsgChannel.send({
        content: `${role}\n Eval Message has been updated`
    });
}
