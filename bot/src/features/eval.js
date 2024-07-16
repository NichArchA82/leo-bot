import getRecruitMessagesSchema from 'command-handler/src/schemas/recruit-messages-schema.js';
import cron from 'node-cron';
import 'dotenv/config';

export default (client, handler) => {
    // 0 23 * * 1
    //scheduled every Monday at 11pm
    cron.schedule('0 23 * * 1', async () => {
        try {
            console.log('schedule firing')
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

                // <NREC_NAME>
                // <@SPONSOR_IF_SPONSORED>
                // <DAYS_SINCE_MIN_EVAL_DATE_PASSED>
                // <SIGN_OFFS_ACHIEVED>/<SIGN_OFFS_REQUIRED>
                statusMsg += `Recruit - ` + member.displayName + "\n";
                statusMsg += `Sponsor - ` + sMember.displayName + "\n";
                const unixTimeStamp = Math.floor(minEvalDate.getTime() / 1000);
                statusMsg += `Min Eval Date ended <t:${unixTimeStamp}:R>\n`;
                statusMsg += checks + "/" + signoffs + " signoffs achieved\n\n";
            }

            // All other NRECs are within their minimum eval period
            if (statusMsg.length) {
                statusMsg += "All other NRECs are within their minimum eval period";
            } else {
                statusMsg = "All NRECs are within their minimul eval period";
            }

            while (true) {
                // Fetch messages in batches of 100
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

                // Update lastMessageId to the ID of the last message in the fetched batch
                lastMessageId = fetchedMessages.last().id;

                // Stop if we fetched fewer than the limit, indicating no more messages
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
            
            if (document.evalStatus?.length) {
                const evalStatusMsg = await evalMsgChannel.messages.fetch(document.evalStatus);
                await evalStatusMsg.edit(statusMsg);
            } else {
                const evalStatusMsg = await evalMsgChannel.send({
                    content: `${statusMsg}`,
                    allowedMentions: {
                        roles: [],
                        users: [],
                    },
                });

                //pin the message to the channel
                await evalStatusMsg.pin();

                await recruitMessagesSchema.findOneAndUpdate({
                    _id: process.env.EVENT_GUILDS,
                }, {
                    $set: {
                        _id: process.env.EVENT_GUILDS,
                        evalStatus: evalStatusMsg.id,
                    }
                }, {
                    upsert: true,
                })
            }

        } catch (error) {
            console.error('Error in scheduled task:', error);
        }
    }, {
        scheduled: true,
        timezone: "America/Denver"
    });
}
