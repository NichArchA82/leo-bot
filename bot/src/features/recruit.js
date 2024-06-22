import getRecruitMessagesSchema from 'command-handler/src/schemas/recruit-messages-schema.js';
import cron from 'node-cron';
import 'dotenv/config'

export default (client, handler) => {
    cron.schedule('0 0 * * *', async () => {
        try {
            const recruitMessagesSchema = getRecruitMessagesSchema(handler);
            const currentDate = new Date();
            currentDate.setUTCHours(0, 0, 0, 0); // Set time to 00:00:00.000 UTC
            const document = await recruitMessagesSchema.findOne({ _id: process.env.EVENT_GUILDS });
            const channel = await client.channels.fetch(document.evalChannel);
            let checks = 0;
            let concerns = 0;
            let roChannel;

            if (document?.roChannel) {
                roChannel = client.channels.cache.get(document.roChannel);

                // If the channel is not in the cache, fetch it
                if (!roChannel) {
                    roChannel = await client.channels.fetch(document.roChannel);
                }
            }
            if (!document) return;

            const filteredEvalMessages = document.evalMessages.filter(evalMessage => {
                return evalMessage.minEvalDate <= currentDate;
            });

            for (const msg of filteredEvalMessages) {
                const message = await channel.messages.fetch(msg.messageId); 
                const reactions = message.reactions.cache;
                const member = await message.guild.members.fetch(msg.recruitId);
                const sponsor = msg.sponsorId;

                for (const [emoji, reaction] of reactions) {
                    if (emoji === '✅') checks = reaction.count;
                    else if (emoji === '❌') concerns = reaction.count
                }

                if (checks >= 1 && sponsor !== 'None') {
                    roChannel.send({
                        content: `Recruit "${member}" received all their signoffs ( https://discord.com/channels/${message.guild.id}/${message.channelId}/${message.id} )`,
                        allowedMentions: {
                            roles: [],
                            users: [],
                        },
                    })
                } else if (checks >= 10 && sponsor === 'None') {
                    await roChannel.send({
                        content: `Recruit "${member}" received all their signoffs ( https://discord.com/channels/${message.guild.id}/${message.channelId}/${message.id} )`,
                        allowedMentions: {
                            roles: [],
                            users: [],
                        },
                    })
                }
            }
        } catch {}
    }, {
        scheduled: true,
        timezone: "America/Denver"
    });
}