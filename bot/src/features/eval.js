import getRecruitMessagesSchema from 'command-handler/src/schemas/recruit-messages-schema.js';
import cron from 'node-cron';
import 'dotenv/config';

export default (client, handler) => {
    // 0 23 * * 1
    //scheduled every Monday at 11pm
    cron.schedule('* * * * *', async () => {
        try {
            console.log('schedule firing')
            const recruitMessagesSchema = getRecruitMessagesSchema(handler);
            const currentDate = new Date();
            const document = await recruitMessagesSchema.findOne({ _id: process.env.EVENT_GUILDS });
            let statusMsg = "";
            let lastMessageId = null;
            let messagesToDelete = [];
            if (!document || !document.evalMsgChannel?.length) return;

            const channel = await client.channels.fetch(document.evalMsgChannel);

            console.log('channel', channel)

            currentDate.setUTCHours(0, 0, 0, 0); // Set time to 00:00:00.000 UTC

            const filteredEvalMessages = document.evalMessages.filter(evalMessage => {
                return new Date(evalMessage.minEvalDate) <= currentDate;
            });

            for (const msg of filteredEvalMessages) {
                const message = await channel.messages.fetch(msg.messageId);
                console.log('message', message)
                const reactions = message.reactions.cache;
                const member = await message.guild.members.fetch(msg.recruitId);
                const sponsor = msg.sponsorId;
                const signoffs = sponsor === 'None' ? 10 : 8;

                const checks = reactions.get('✅')?.count || 0;
                const concerns = reactions.get('❌')?.count || 0;

                // <NREC_NAME>
                // <@SPONSOR_IF_SPONSORED>
                // <DAYS_SINCE_MIN_EVAL_DATE_PASSED>
                // <SIGN_OFFS_ACHIEVED>/<SIGN_OFFS_REQUIRED>
                statusMsg += member.displayName + "\n";
                statusMsg += sponsor + "\n";
                statusMsg += currentDate - document.minEvalDate + "day(s)\n";
                statusMsg += checks + "/" + signoffs + "\n\n";
            }

            // All other NRECs are within their minimum eval period
            statusMsg += "All other NRECs are within their minimum eval period"

            while (true) {
                // Fetch messages in batches of 100
                const options = { limit: 100 };
                if (lastMessageId) {
                    options.before = lastMessageId;
                }
                
                const fetchedMessages = await channel.messages.fetch(options);

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
                const evalStatusMsg = await channel.messages.fetch(document.evalStatus);
                await evalStatusMsg.edit(statusMsg);
            } else {
                const evalStatusMsg = await channel.send({
                    content: `${statusMsg}`,
                    allowedMentions: {
                        roles: [],
                        users: [],
                    },
                });

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
