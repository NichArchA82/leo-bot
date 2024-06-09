import { ApplicationCommandOptionType, PermissionFlagsBits } from 'discord.js';
import commandTypes from '../cmd-handler/command-types.js';
import getRecruitMessageSchema from '../schemas/recruit-message-schema.js';
import getPromotionMessageSchema from '../schemas/promotion-message-schema.js';

export default {
    description: 'Handles recruits',
    type: commandTypes.Slash,
    guildOnly: true,
    reply: false,
    permissions: [PermissionFlagsBits.Administrator],
    options: [
        {
            name: 'edit',
            description: 'Edit messages',
            type: ApplicationCommandOptionType.SubcommandGroup,
            options: [
                {
                    name: 'recruit-welcome',
                    description: 'Edit the recruit message',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'message',
                            description: 'The new recruit message',
                            type: ApplicationCommandOptionType.String,
                            required: true,
                        } 
                    ]
                },
                {
                    name: 'recruit-promotion',
                    description: 'Edit the promotion message',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'message',
                            description: 'The new promotion message',
                            type: ApplicationCommandOptionType.String,
                            required: true,
                        } 
                    ]
                },
            ]
        },
        {
            name: 'send',
            description: 'Send messages',
            type: ApplicationCommandOptionType.SubcommandGroup,
            options: [
                {
                    name: 'recruit-welcome',
                    description: 'Send recruit message',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'recruited-user',
                            description: 'The new recruit',
                            type: ApplicationCommandOptionType.User,
                            required: true,
                        }
                    ]
                },
                {
                    name: 'recruit-promotion',
                    description: 'Send promotion message',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'promoted-user',
                            description: 'promoted member',
                            type: ApplicationCommandOptionType.User,
                            required: true,
                        }
                    ]
                }
            ]
        }
    ],

    run: async ({ handler, interaction, response, guild }) => {
        if (!handler.isDbConnected) {
            response({
                content: 'db error: No Connection. Contact developers for help',
                ephemeral: true,
            });
    
            return;
        }
    
        const subCommandGroup = interaction.options.getSubcommandGroup(false);
        const subCommand = interaction.options.getSubcommand(false);
        
    
        if (subCommandGroup === 'edit') {
            if (subCommand === 'recruit-welcome') {
                const message = interaction.options.getString('message');
                const recruitMessageSchema = getRecruitMessageSchema(handler);
                await recruitMessageSchema.findOneAndUpdate({
                    _id: guild.id,
                }, {
                    _id: guild.id,
                    message,
                }, {
                    upsert: true,
                })

                response({
                    content: `Recruit message edited to: ${message}`,
                    ephemeral: true,
                });
            } else if (subCommand === 'recruit-promotion') {
                const message = interaction.options.getString('message')
                const promotionMessageSchema = getPromotionMessageSchema(handler);
                await promotionMessageSchema.findOneAndUpdate({
                    _id: guild.id,
                }, {
                    _id: guild.id,
                    message,
                }, {
                    upsert: true,
                })

                response({
                    content: `Promotion message edited to: ${message}`,
                    ephemeral: true,
                });
            }
        } else if (subCommandGroup === 'send') {
            if (subCommand === 'recruit-welcome') {
                const member = interaction.options.getUser('recruited-user');
                const recruitMessageSchema = getRecruitMessageSchema(handler);
                const document = await recruitMessageSchema.findOne({ _id: guild.id });

                if (!document || !document.message.length) {
                    response({
                        content: `recruit-message not found. Please set one with the /recruit edit recruit-message first`,
                        ephemeral: true,
                    });
                    return;
                }

                const message = document.message.replace('<MEMBER>', member);
                response({
                    content: `${message}`,
                    ephemeral: false,
                });
            } else if (subCommand === 'recruit-promotion') {
                const member = interaction.options.getUser('promoted-user');
                const promotionMessageSchema = getPromotionMessageSchema(handler);
                const document = await promotionMessageSchema.findOne({ _id: guild.id });

                if (!document || !document.message.length) {
                    response({
                        content: `promotion-message not found. Please set one with the /recruit edit promotion-message first`,
                        ephemeral: true,
                    });
                    return;
                }

                const message = document.message.replace('<MEMBER>', member);
                response({
                    content: `${message}`,
                    ephemeral: false,
                });
            }
        }
    }
}