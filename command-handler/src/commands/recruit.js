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
                    name: 'inprocessing-greeting',
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
                    name: 'general-greeting',
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
                    name: 'inprocess-channel',
                    description: 'The new inprocess channel',
                    type: ApplicationCommandOptionType.Channel,
                    required: true,
                },
                {
                    name: 'general-channel',
                    description: 'The new general channel',
                    type: ApplicationCommandOptionType.Channel,
                    required: true,
                },
                {
                    name: 'eval-channel',
                    description: 'The new eval channel',
                    type: ApplicationCommandOptionType.Channel,
                    required: true,
                },
                {
                    name: 'recruit-office-channel',
                    description: 'The new recruiting office channel',
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
                    name: 'inprocess-greeting',
                    description: 'Edit the recruit inprocess greeting',
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
                    name: 'general-greeting',
                    description: 'Edit the recruit general greeting message',
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
                    name: 'inprocess-channel',
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
                    name: 'general-channel',
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
                {
                    name: 'recruit-office-channel',
                    description: 'Edit the channel that the recruit notification is sent in',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'channel',
                            description: 'The new recruiting office channel',
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
                    name: 'recruit-welcome',
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
                            name: 'sponsor-user',
                            description: 'The sponsor of the new recruit',
                            type: ApplicationCommandOptionType.User,
                            required: false,
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
        if (!handler.isDbConnected) {  console.log('database object deleted')
            response({
                content: 'db error: No Connection. Contact developers for help',
                ephemeral: true,
            });
    
            return;
        }
    
        const subCommandGroup = interaction.options.getSubcommandGroup(false);
        const subCommand = interaction.options.getSubcommand(false);
        
    
        if (subCommand === 'setup') {
            const procGreeting = interaction.options.getString('inprocessing-greeting');
            const rPmessage = interaction.options.getString('recruit-promotion');
            const rGmessage = interaction.options.getString('general-greeting');
            const rEmessage = interaction.options.getString('recruit-eval');
            const genChannel = interaction.options.getChannel('general-channel');
            const procChannel = interaction.options.getChannel('inprocess-channel');
            const eChannel = interaction.options.getChannel('eval-channel');
            const roChannel = interaction.options.getChannel('recruit-office-channel');
            const recruitMessagesSchema = getRecruitMessagesSchema(handler);

            await recruitMessagesSchema.findOneAndUpdate({
                _id: guild.id,
            }, {
                $set: {
                    _id: guild.id,
                    genGreeting: rGmessage,
                    promotion: rPmessage,
                    procGreeting: procGreeting,
                    eval: rEmessage,
                    genChannel: genChannel.id,
                    procChannel: procChannel.id,
                    evalChannel: eChannel.id,
                    roChannel: roChannel
                }
            }, {
                upsert: true,
            })
            response({
                content: 'setup complete',
                ephemeral: true,
            });
        } else if (subCommandGroup === 'edit') {
            if (subCommand === 'inprocess-greeting') {
                    const message = interaction.options.getString('message');
                    const recruitMessagesSchema = getRecruitMessagesSchema(handler);
                    await recruitMessagesSchema.findOneAndUpdate({
                        _id: guild.id,
                    }, {
                        $set: {
                            _id: guild.id,
                            procGreeting: message
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
            } else if (subCommand === 'general-greeting') {
                const message = interaction.options.getString('message')
                const recruitMessagesSchema = getRecruitMessagesSchema(handler);
                await recruitMessagesSchema.findOneAndUpdate({
                    _id: guild.id,
                }, {
                    $set: {
                        _id: guild.id,
                        genGreeting: message
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
            } else if (subCommand === 'inprocess-channel') {
                const channel = interaction.options.getChannel('channel')
                const recruitMessagesSchema = getRecruitMessagesSchema(handler);
                await recruitMessagesSchema.findOneAndUpdate({
                    _id: guild.id,
                }, {
                    $set: {
                        _id: guild.id,
                        procGreeting: channel
                    }
                }, {
                    upsert: true,
                })

                response({
                    content: `recruit inprocess channel edited to: ${channel}`,
                    ephemeral: true,
                });
            } else if (subCommand === 'general-channel') {
                const channel = interaction.options.getChannel('channel')
                const recruitMessagesSchema = getRecruitMessagesSchema(handler);
                await recruitMessagesSchema.findOneAndUpdate({
                    _id: guild.id,
                }, {
                    $set: {
                        _id: guild.id,
                        genChannel: channel
                    }
                }, {
                    upsert: true,
                })

                response({
                    content: `recruit general channel edited to: ${channel}`,
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
            } else if (subCommand === 'recruit-office-channel') { 
                const channel = interaction.options.getChannel('channel')
                const recruitMessagesSchema = getRecruitMessagesSchema(handler);
                await recruitMessagesSchema.findOneAndUpdate({
                    _id: guild.id,
                }, {
                    $set: {
                        _id: guild.id,
                        roChannel: channel
                    }
                }, {
                    upsert: true,
                })

                response({
                    content: `recruit office channel edited to: ${channel}`,
                    ephemeral: true,
                });
            }
        } else if (subCommandGroup === 'send') {
            if (subCommand === 'recruit-welcome') {
                    const user = interaction.options.getUser('recruited-user');
                    const sponsor = interaction.options.getUser('sponsor-user') ?? 'None';
                    const minEvalValue = sponsor === 'None' ? 10 : 8;
                    const recruitMessagesSchema = getRecruitMessagesSchema(handler);
                    const document = await recruitMessagesSchema.findOne({ _id: guild.id });
                    let displayName;
                    try {
                        // Fetch the GuildMember object using the user's ID
                        const guild = interaction.guild; // Assuming this is used in a command context where the guild is available
                        const member = await guild.members.fetch(user.id);
                        displayName = member.displayName; // This will be the nickname in the guild, or the username if no nickname is set
                    } catch (error) {
                        console.error('Error fetching member:', error);
                    }

                    if (!document || !document.genGreeting?.length || !document.procGreeting?.length || !document.eval?.length || !document.genChannel?.length || !document.procChannel?.length || !document.evalChannel?.length) {
                        response({
                            content: `error. Not all required fields found in the database. Please run /recruit setup first.`,
                            ephemeral: true,
                        });
                        return;
                    }

                    const currentDate = new Date();
                    currentDate.setDate(currentDate.getDate() + 7);
                    const unixTimestamp = Math.floor(currentDate.getTime() / 1000);

                    const genGreetMsg = document.genGreeting.replaceAll('<MEMBER>', user);
                    const inProcGreetMsg = document.procGreeting.replaceAll('<MEMBER>', user);
                    const eMessage = document.eval.replaceAll('<MEMBER>', displayName).replaceAll('<SPONSOR>', sponsor).replaceAll('<DATE>', `<t:${unixTimestamp}:D>`).replaceAll('<MIN_EVAL>', minEvalValue);
                    const genChannel = await guild.channels.fetch(document.genChannel);
                    const procChannel = await guild.channels.fetch(document.procChannel);
                    const evalChannel = await guild.channels.fetch(document.evalChannel);

                    if (!genChannel || !procChannel || !evalChannel) {
                        response({
                            content: `error sending messages. Incorrect channel ids specified`,
                            ephemeral: true,
                        });
                        return;
                    }

                    try {
                        await genChannel.send(genGreetMsg)
                        await procChannel.send(inProcGreetMsg)
                        const evalMsg = await evalChannel.send({
                            content: `${eMessage}`,
                            allowedMentions: {
                                roles: [],
                                users: [],
                            },
                        })
                        await recruitMessagesSchema.findOneAndUpdate(
                            { _id: guild.id },
                            {
                                $push: {
                                    evalMessages: {
                                        messageId: evalMsg.id,
                                        sponsorId: typeof sponsor === 'object' ? sponsor.id : 'None',
                                        recruitId: user.id,
                                        minEvalDate: currentDate.setUTCHours(0, 0, 0, 0),
                                    }
                                }
                            },
                            { upsert: true }
                        );
                    } catch (err) {
                        response({
                            content: `error sending recruit messages.`,
                            ephemeral: true,
                        });
                        return;
                    }

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
                content: `The recruit command has 3 subcommand groups: setup, edit, and send. Setup will walk users through the entire setup process for the messages. The following placeholders are: <MEMBER> this will replace the part of the message with the recruit (used in all three messages), <DATE> this will replace the part of the message with the current date with 7 days added (min eval of a week)(used in eval message only), <MIN_EVAL> This will replace the part of the message with the number of checks required, 8 for sponsored recruits 10 for non-sponsored(used in eval message only), and <SPONSOR> this will replace the part of the message with the sponsored user, or None if no sponsor was provided. (Eval message only). using recruit send recruit-welcome will send all three messages, and the edit commands are for individually editing the messages.`,
                ephemeral: true,
            });
        }
        
    }
}