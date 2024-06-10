import { ApplicationCommandOptionType, PermissionFlagsBits } from 'discord.js';
import commandTypes from '../cmd-handler/command-types.js';
import getRecruitMessagesSchema from '../schemas/recruit-messages-schema.js';

export default {
    description: 'Handles recruits',
    type: commandTypes.Slash,
    guildOnly: true,
    reply: false,
    permissions: [PermissionFlagsBits.Administrator],
    options: [
        {
            name: 'setup',
            description: 'setup all messages',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'recruit-welcome',
                    description: 'The recruit welcome message to set',
                    type: ApplicationCommandOptionType.String,
                    required: true
                },
                {
                    name: 'recruit-promotion',
                    description: 'The recruit promotion message to set',
                    type: ApplicationCommandOptionType.String,
                    required: true
                },
                {
                    name: 'recruit-greeting',
                    description: 'The recruit greeting message to set',
                    type: ApplicationCommandOptionType.String,
                    required: true
                },
                {
                    name: 'recruit-eval',
                    description: 'The recruit eval message to set',
                    type: ApplicationCommandOptionType.String,
                    required: true
                },
                {
                    name: 'greeting-channel',
                    description: 'The new greeting channel',
                    type: ApplicationCommandOptionType.Channel,
                    required: true,
                },
                {
                    name: 'welcome-channel',
                    description: 'The new welcome channel',
                    type: ApplicationCommandOptionType.Channel,
                    required: true,
                },
                {
                    name: 'eval-channel',
                    description: 'The new eval channel',
                    type: ApplicationCommandOptionType.Channel,
                    required: true,
                },
            ]
        },
        {
            name: 'edit',
            description: 'Edit messages and channels',
            type: ApplicationCommandOptionType.SubcommandGroup,
            options: [
                {
                    name: 'recruit-greeting',
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
                {
                    name: 'recruit-welcome',
                    description: 'Edit the recruit message sent in the welcome channel',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'message',
                            description: 'The new greeting message',
                            type: ApplicationCommandOptionType.String,
                            required: true,
                        } 
                    ]
                },
                {
                    name: 'recruit-eval',
                    description: 'Edit the recruit message sent in the recruitment board',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'message',
                            description: 'The new eval message',
                            type: ApplicationCommandOptionType.String,
                            required: true,
                        } 
                    ]
                },
                {
                    name: 'greeting-channel',
                    description: 'Edit the channel that the greeting is sent in',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'channel',
                            description: 'The new greeting channel',
                            type: ApplicationCommandOptionType.Channel,
                            required: true,
                        } 
                    ]
                },
                {
                    name: 'welcome-channel',
                    description: 'Edit the channel that the welcome is sent in',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'channel',
                            description: 'The new welcome channel',
                            type: ApplicationCommandOptionType.Channel,
                            required: true,
                        } 
                    ]
                },
                {
                    name: 'eval-channel',
                    description: 'Edit the channel that the eval is sent in',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'channel',
                            description: 'The new eval channel',
                            type: ApplicationCommandOptionType.Channel,
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
                    name: 'recruit-greeting',
                    description: 'Send recruit message',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'recruited-user',
                            description: 'The new recruit',
                            type: ApplicationCommandOptionType.User,
                            required: true,
                        },
                        {
                            name: 'sponser-user',
                            description: 'The sponser of the new recruit',
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
        },
        {
            name: 'help',
            description: 'displays the help menu for commandroles',
            type: ApplicationCommandOptionType.Subcommand
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
        
    
        if (subCommand === 'setup') {
            const rWmessage = interaction.options.getString('recruit-welcome');
            const rPmessage = interaction.options.getString('recruit-promotion');
            const rGmessage = interaction.options.getString('recruit-greeting');
            const rEmessage = interaction.options.getString('recruit-eval');
            const gChannel = interaction.options.getChannel('greeting-channel');
            const wChannel = interaction.options.getChannel('welcome-channel');
            const eChannel = interaction.options.getChannel('eval-channel');
            const recruitMessagesSchema = getRecruitMessagesSchema(handler);

            await recruitMessagesSchema.findOneAndUpdate({
                _id: guild.id,
            }, {
                $set: {
                    _id: guild.id,
                    greeting: rGmessage,
                    promotion: rPmessage,
                    welcome: rWmessage,
                    eval: rEmessage,
                    greetChannel: gChannel.id,
                    welChannel: wChannel.id,
                    evalChannel: eChannel.id
                }
            }, {
                upsert: true,
            })
            response({
                content: 'setup complete',
                ephemeral: true,
            });
        } else if (subCommandGroup === 'edit') {
            if (subCommand === 'recruit-welcome') {
                    const message = interaction.options.getString('message');
                    const recruitMessagesSchema = getRecruitMessagesSchema(handler);
                    await recruitMessagesSchema.findOneAndUpdate({
                        _id: guild.id,
                    }, {
                        $set: {
                            _id: guild.id,
                            welcome: message
                        }
                    }, {
                        upsert: true,
                    })

                    response({
                        content: `Recruit message edited to: ${message}`,
                        ephemeral: true,
                    });
            } else if (subCommand === 'recruit-promotion') {
                    const message = interaction.options.getString('message')
                    const recruitMessagesSchema = getRecruitMessagesSchema(handler);
                    await recruitMessagesSchema.findOneAndUpdate({
                        _id: guild.id,
                    }, {
                        $set: {
                            _id: guild.id,
                            promotion: message
                        }
                    }, {
                        upsert: true,
                    })

                    response({
                        content: `Promotion message edited to: ${message}`,
                        ephemeral: true,
                    });
            } else if (subCommand === 'recruit-greeting') {
                const message = interaction.options.getString('message')
                const recruitMessagesSchema = getRecruitMessagesSchema(handler);
                await recruitMessagesSchema.findOneAndUpdate({
                    _id: guild.id,
                }, {
                    $set: {
                        _id: guild.id,
                        greeting: message
                    }
                }, {
                    upsert: true,
                })

                response({
                    content: `recruit greeting edited to: ${message}`,
                    ephemeral: true,
                });
            } else if (subCommand === 'recruit-eval') {
                const message = interaction.options.getString('message')
                const recruitMessagesSchema = getRecruitMessagesSchema(handler);
                await recruitMessagesSchema.findOneAndUpdate({
                    _id: guild.id,
                }, {
                    $set: {
                        _id: guild.id,
                        eval: message
                    }
                }, {
                    upsert: true,
                })

                response({
                    content: `recruit eval message edited to: ${message}`,
                    ephemeral: true,
                });
            } else if (subCommand === 'greeting-channel') {
                const channel = interaction.options.getChannel('channel')
                const recruitMessagesSchema = getRecruitMessagesSchema(handler);
                await recruitMessagesSchema.findOneAndUpdate({
                    _id: guild.id,
                }, {
                    $set: {
                        _id: guild.id,
                        greetChannel: channel
                    }
                }, {
                    upsert: true,
                })

                response({
                    content: `recruit greeting channel edited to: ${channel}`,
                    ephemeral: true,
                });
            } else if (subCommand === 'welcome-channel') {
                const channel = interaction.options.getChannel('channel')
                const recruitMessagesSchema = getRecruitMessagesSchema(handler);
                await recruitMessagesSchema.findOneAndUpdate({
                    _id: guild.id,
                }, {
                    $set: {
                        _id: guild.id,
                        welChannel: channel
                    }
                }, {
                    upsert: true,
                })

                response({
                    content: `recruit welcome channel edited to: ${channel}`,
                    ephemeral: true,
                });
            } else if (subCommand === 'eval-channel') {
                const channel = interaction.options.getChannel('channel')
                const recruitMessagesSchema = getRecruitMessagesSchema(handler);
                await recruitMessagesSchema.findOneAndUpdate({
                    _id: guild.id,
                }, {
                    $set: {
                        _id: guild.id,
                        evalChannel: channel
                    }
                }, {
                    upsert: true,
                })

                response({
                    content: `recruit eval channel edited to: ${channel}`,
                    ephemeral: true,
                });
            }
        } else if (subCommandGroup === 'send') {
            if (subCommand === 'recruit-greeting') {
                    const recruit = interaction.options.getUser('recruited-user');
                    const sponser = interaction.options.getUser('sponser-user');
                    const recruitMessagesSchema = getRecruitMessagesSchema(handler);
                    const document = await recruitMessagesSchema.findOne({ _id: guild.id });

                    if (!document || !document.greeting?.length || !document.welcome?.length || !document.eval?.length || !document.greetChannel?.length || !document.welChannel?.length || !document.evalChannel?.length) {
                        response({
                            content: `error. Not all required fields found in the database. Please run /recruit setup first.`,
                            ephemeral: true,
                        });
                        return;
                    }

                    const currentDate = new Date();
                    currentDate.setDate(currentDate.getDate() + 7);
                    const unixTimestamp = Math.floor(currentDate.getTime() / 1000);
                    const gMessage = document.greeting.replaceAll('<MEMBER>', recruit);
                    const wMessage = document.welcome.replaceAll('<MEMBER>', recruit);
                    const eMessage = document.eval.replaceAll('<MEMBER>', recruit).replaceAll('<SPONSER>', sponser).replaceAll('<DATE>', `<t:${unixTimestamp}:F>`);
                    const gChannel = await guild.channels.fetch(document.greetChannel);
                    const wChannel = await guild.channels.fetch(document.welChannel);
                    const eChannel = await guild.channels.fetch(document.evalChannel);

                    if (!gChannel || !wChannel || !eChannel) {
                        response({
                            content: `error sending messages. Incorrect channel ids specified`,
                            ephemeral: true,
                        });
                        return;
                    }

                    await gChannel.send(gMessage)
                    await wChannel.send(wMessage)
                    await eChannel.send(eMessage)

                    response({
                        content: `Recruit messages sent.`,
                        ephemeral: true,
                    });
            } else if (subCommand === 'recruit-promotion') {
                    const member = interaction.options.getUser('promoted-user');
                    const recruitMessagesSchema = getRecruitMessagesSchema(handler);
                    const document = await recruitMessagesSchema.findOne({ _id: guild.id });

                    if (!document || !document.promotion?.length) {
                        response({
                            content: `promotion-message not found. Please set one with the /recruit edit promotion-message first`,
                            ephemeral: true,
                        });
                        return;
                    }

                    const message = document.promotion.replaceAll('<MEMBER>', member);
                    response({
                        content: `${message}`,
                        ephemeral: false,
                    });
                }
        } else if (subCommand === 'help') {
            response({
                content: `${message}`,
                ephemeral: true,
            });
        }
        
    }
}