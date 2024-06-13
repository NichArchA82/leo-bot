import getRecruitMessagesSchema from '../../schemas/recruit-messages-schema.js';

export default async (reaction, _, handler) => {
    try {
        const message = await reaction.message.fetch()
        const reactions = message.reactions.cache;
        let evalMsg = false;
        let checks = 0;
        let concerns = 0;
        let roChannel;
        let sponsor;
        let member;
        const recruitMessagesSchema = getRecruitMessagesSchema(handler);
        const document = await recruitMessagesSchema.findOne({ _id: message.guild.id });
        if (document?.roChannel) {
            roChannel = message.guild.channels.cache.get(document.roChannel);

            // If the channel is not in the cache, fetch it
            if (!roChannel) {
                roChannel = await message.guild.channels.fetch(document.roChannel);
            }
        }
        if (!document) return;

        for (const msg of document.evalMessages) {
            if (message.id === msg.messageId) {
                member = await message.guild.members.fetch(msg.recruitId);
                sponsor = msg.sponsorId;
                evalMsg = true;
                break;
            }
        }
        
        if (!evalMsg) return; 

        for (const [emoji, reaction] of reactions) {
            // Fetch users who reacted with this emoji
            const users = await reaction.users.fetch();
            if (emoji === '✅') checks = reaction.count;
            else if (emoji === '❌') concerns = reaction.count

            for (const user of users.values()) {
                if (user.id === sponsor) {
                    await reaction.users.remove(user.id);
                    await user.send({
                        content: `Sponsors cannot check off their own recruit. Your check has been removed`,
                        ephemeral: true
                    });
                    if (emoji === '✅') checks -= 1;
                    else if (emoji === '❌') concerns -= 1;
                }
                if (emoji !== '✅' && emoji !== '❌') {
                    await reaction.users.remove(user.id);
                    await user.send({
                        content: `Invalid reaction please use \`✅\` in favor or \`❌\` to raise a concern. If you raise a concern, please post a rational on why`
                    })
                }
                if (emoji === '❌') {
                    await roChannel.send({
                        content: `${user} raised a concern against recruit "${member}" ( https://discord.com/channels/${message.guild.id}/${message.channelId}/${message.id} )`,
                        allowedMentions: {
                            roles: [],
                            users: [],
                        },
                    })
                }
            }
        }
        if (checks === 8 && concerns === 0 && sponsor !== 'None') {
            roChannel.send({
                content: `Recruit "${member}" received all their signoffs ( https://discord.com/channels/${message.guild.id}/${message.channelId}/${message.id} )`,
                allowedMentions: {
                    roles: [],
                    users: [],
                },
            })
        } else if (checks === 10 && concerns === 0 && sponsor === 'None') {
            await roChannel.send({
                content: `Recruit "${member}" received all their signoffs ( https://discord.com/channels/${message.guild.id}/${message.channelId}/${message.id} )`,
                allowedMentions: {
                    roles: [],
                    users: [],
                },
            })
        }
    } catch (error) {
        console.error(error);
    }
}