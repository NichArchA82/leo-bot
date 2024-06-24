import getRecruitMessagesSchema from 'command-handler/src/schemas/recruit-messages-schema.js';
import cron from 'node-cron';
import 'dotenv/config';

export default (client, handler) => {
    cron.schedule('0 0 * * *', async () => {
        try {
            const recruitMessagesSchema = getRecruitMessagesSchema(handler);
            const currentDate = new Date();
            currentDate.setUTCHours(0, 0, 0, 0); // Set time to 00:00:00.000 UTC
            const document = await recruitMessagesSchema.findOne({ _id: process.env.EVENT_GUILDS });
            if (!document) return;

            const channel = await client.channels.fetch(document.evalChannel);
            let roChannel;

            if (document.roChannel) {
                roChannel = client.channels.cache.get(document.roChannel);
                if (!roChannel) {
                    roChannel = await client.channels.fetch(document.roChannel);
                }
            }

            const filteredEvalMessages = document.evalMessages.filter(evalMessage => {
                return new Date(evalMessage.minEvalDate) <= currentDate;
            });

            for (const msg of filteredEvalMessages) {
                const message = await channel.messages.fetch(msg.messageId);
                const reactions = message.reactions.cache;
                const member = await message.guild.members.fetch(msg.recruitId);
                const sponsor = msg.sponsorId;

                const checks = reactions.get('✅')?.count || 0;
                const concerns = reactions.get('❌')?.count || 0;

                if ((checks >= 8 && sponsor !== 'None') || (checks >= 10 && sponsor === 'None')) {
                    roChannel.send({
                        content: `Recruit "${member}" received all their signoffs ( https://discord.com/channels/${message.guild.id}/${message.channelId}/${message.id} )`,
                        allowedMentions: {
                            roles: [],
                            users: [],
                        },
                    });
                }
            }
        } catch (error) {
            console.error('Error in scheduled task:', error);
        }
    }, {
        scheduled: true,
        timezone: "America/Denver"
    });
}