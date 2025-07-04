import getRecruitMessagesSchema from '../../schemas/recruit-messages-schema.js';

export default async ({ eventArgs, handler }) => {
    const [reaction, user] = eventArgs;

    try {
        const message = await reaction.message.fetch();
        const currentDate = new Date();
        let evalMsg = false;
        let roChannel;
        let sponsor;
        let member;
        let cooldown;
        let promoDate;
        let createdDate;
        const reactionMember = await message.guild.members.fetch(user.id);
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
                cooldown = new Date(msg.cooldown);
                createdDate = new Date(msg.createdAt);
                break;
            }
        }

        for (const nMember of document.comparisons) {
            if (user.id === nMember.memberId) {
                promoDate = new Date(nMember.promotionDate); 
            }
        }
        
        if (!evalMsg) return;

        if (currentDate < cooldown && reaction.emoji.name === '✅') {
            const cooldownTimestamp = Math.floor(cooldown.getTime() / 1000);
            await reaction.users.remove(user.id);

            try {
                await user.send({
                    content: `This NREC has only just joined NATO and is under a 12-hour cool down until <t:${cooldownTimestamp}:F> before we are accepting signoffs. From that point please ensure you have played in at least one match with them **__after__** they officially become a NREC before returning to provide your signoff, thank you 🫡`
                });
            } catch {
                await roChannel.send({
                    content: `Leo Bot attempted to alert \`${reactionMember.displayName}\` that recruit https://discord.com/channels/${message.guild.id}/${message.channelId}/${message.id} has only just joined NATO and is under cooldown, but their DMs are closed`
                });
            } finally {
                return;
            }
        }

        if (user.id === sponsor && reaction.emoji.name === '✅') {
            await reaction.users.remove(user.id);

            try {
                await user.send({
                    content: `Sponsors cannot check off their own recruit. Your check has been removed`,
                    ephemeral: true
                });
            } catch {
                await roChannel.send({
                    content: `Leo Bot attempted to alert \`${reactionMember.displayName}\` that sponsors cannot sign off on their own recruit, but their DMs are closed`
                });
            }
        }
        else if (reaction.emoji.name !== '✅' && reaction.emoji.name !== '❌') {
            await reaction.users.remove(user.id);
            try {
                await user.send({
                    content: `Invalid reaction please use \`✅\` in favor or \`❌\` to raise a concern. If you raise a concern, please post a rational on why`
                });
            } catch {
                await roChannel.send({
                    content: `Leo Bot attempted to alert \`${reactionMember.displayName}\` that they reacted with an invalid reaction, but their DMs are closed`
                }); 
            }
        } else if (promoDate) {
            if (promoDate > createdDate && reaction.emoji.name === '✅') {
                if (new Date(reactionMember.joinedAt) > createdDate) return;

                const promoDateTimestamp = Math.floor(promoDate.getTime() / 1000);
                await reaction.users.remove(user.id);
                try {
                    await user.send({
                        content: `You became a full NATO member at <t:${promoDateTimestamp}:F>, you may only sign off NRECs who joined NATO after this point. Thank you for dedication to the recruitment process. 🫡`
                    });
                } catch {
                    await roChannel.send({
                        content: `Leo Bot attempted to alert \`${reactionMember.displayName}\` that they cannot sign off on recruits whose eval time has overlapped with their own, but their DMs are closed`
                    }); 
                }
            }
        }
        if (reaction.emoji.name === '❌') {
            await roChannel.send({
                content: `\`${reactionMember.displayName}\` raised a concern against recruit \`${member.displayName}\` ( https://discord.com/channels/${message.guild.id}/${message.channelId}/${message.id} )`,
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