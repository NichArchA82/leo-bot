import getRecruitMessagesSchema from 'command-handler/src/schemas/recruit-messages-schema.js';
import cron from 'node-cron';
import 'dotenv/config';
import { EmbedBuilder } from 'discord.js';

export default (client, handler) => {
    // Scheduled every Monday at 11pm
    // 0 23 * * 1
    cron.schedule('0 23 * * 1', async () => {
        try {
            console.log('Schedule firing');
            const recruitMessagesSchema = getRecruitMessagesSchema(handler);
            const currentDate = new Date();
            let document = await recruitMessagesSchema.findOne({ _id: process.env.EVENT_GUILDS });
            let statusMsg = "";
            let lastMessageId = null;
            let messagesToDelete = [];
            if (!document || !document.evalMsgChannel?.length) return;

            const evalBoardChannel = await client.channels.fetch(document.evalChannel);
            const evalMsgChannel = await client.channels.fetch(document.evalMsgChannel);

            currentDate.setUTCHours(0, 0, 0, 0); // Set time to 00:00:00.000 UTC

            const filteredEvalMessages = document.evalMessages.filter(evalMessage => {
                return new Date(evalMessage.minEvalDate) <= currentDate;
            });

            for (const msg of filteredEvalMessages) {
                const minEvalDate = new Date(msg.minEvalDate);
                const message = await evalBoardChannel.messages.fetch(msg.messageId);
                const reactions = message.reactions.cache;
                const member = await message.guild.members.fetch(msg.recruitId);
                const sponsor = msg.sponsorId;
                const signoffs = sponsor === 'None' ? 10 : 8;
                let sMember = '';

                if (sponsor === 'None') {
                    sMember = 'None';
                } else {
                    sMember = await message.guild.members.fetch(msg.sponsorId);
                }

                const checks = reactions.get('✅')?.count || 0;
                const concerns = reactions.get('❌')?.count || 0;

                statusMsg += `Recruit - ${member.displayName}\n`;
                statusMsg += `Sponsor - ${sMember && sMember.displayName ? sMember.displayName : 'None'}\n`;
                const unixTimeStamp = Math.floor(minEvalDate.getTime() / 1000);
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

            if (document.evalStatus?.length) {
                try {
                    await evalMsgChannel.messages.fetch(document.evalStatus);
                } catch {
                    await recruitMessagesSchema.findOneAndUpdate({
                        _id: process.env.EVENT_GUILDS,
                    }, {
                        $set: {
                            _id: process.env.EVENT_GUILDS,
                            evalStatus: ""
                        }
                    }, {
                        upsert: true,
                    })
                    document = await recruitMessagesSchema.findOne({ _id: process.env.EVENT_GUILDS });
                }
            }

            const createEmbeds = (content) => {
                const chunks = [];
                for (let i = 0; i < content.length; i += 4096) {
                    chunks.push(content.slice(i, i + 4096));
                }

                return chunks.map(chunk => new EmbedBuilder().setDescription(chunk).setColor('#0099ff'));
            }

            const sendOrUpdateMessage = async (embeds) => {
                if (document.evalStatus?.length) {
                    const evalStatusMsg = await evalMsgChannel.messages.fetch(document.evalStatus);
                    await evalStatusMsg.edit({ embeds }).catch(console.error);
                } else {
                    const evalStatusMsg = await evalMsgChannel.send({ embeds }).catch(console.error);
                    await evalStatusMsg.pin();

                    await recruitMessagesSchema.findOneAndUpdate(
                        { _id: process.env.EVENT_GUILDS },
                        { $set: { _id: process.env.EVENT_GUILDS, evalStatus: evalStatusMsg.id } },
                        { upsert: true }
                    );
                }
            }

            const embeds = createEmbeds(statusMsg);
            await sendOrUpdateMessage(embeds);

            const guild = await client.guilds.fetch(process.env.EVENT_GUILDS);
            const role = guild.roles.cache.find(role => role.name === 'Recruiting Specialist');
            await evalMsgChannel.send({
                content: `${role}\n Eval Message has been updated`
            });

        } catch (error) {
            console.error('Error in scheduled task:', error);
        }
    }, {
        scheduled: true,
        timezone: "America/Denver"
    });
}
