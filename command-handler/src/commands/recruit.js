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
                    description: 'The new eval board channel',
                    type: ApplicationCommandOptionType.Channel,
                    required: true,
                },
                {
                    name: 'eval-msg-channel',
                    description: 'The new eval message channel',
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
                    name: 'eval-msg-channel',
                    description: 'Edit the channel that the eval status message is sent in',
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
                        },
                        {
                            name: 'cooldown',
                            description: 'If the cooldown should be applied',
                            type: ApplicationCommandOptionType.Boolean,
                            required: false,
                        }
                    ]
                },
                {
                    name: 'recruit-eval',
                    description: 'Send recruit eval message',
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
                        },
                        {
                            name: 'cooldown',
                            description: 'If the cooldown should be applied',
                            type: ApplicationCommandOptionType.Boolean,
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
            name: 'preview',
            description: 'preview messages',
            type: ApplicationCommandOptionType.SubcommandGroup,
            options: [
                {
                    name: 'inprocess-greeting',
                    description: 'Send inprocess message in current channel',
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
                    name: 'general-greeting',
                    description: 'Send the general greeting message in current channel',
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
                    name: 'eval-message',
                    description: 'Send the eval message in current channel',
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
                        },
                        {
                            name: 'cooldown',
                            description: 'If the cooldown should be applied',
                            type: ApplicationCommandOptionType.Boolean,
                            required: false,
                        }
                    ]
                },
                {
                    name: 'recruit-promotion',
                    description: 'Send promotion message in current channel',
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
        await interaction.deferReply({ ephemeral: true });

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
            const eMsgChannel = interaction.options.getChannel('eval-msg-channel');
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
                    evalMsgChannel: eMsgChannel,
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
                        procChannel: channel
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
            } else if (subCommand === 'eval-msg-channel') {
                const channel = interaction.options.getChannel('channel')
                const recruitMessagesSchema = getRecruitMessagesSchema(handler);
                await recruitMessagesSchema.findOneAndUpdate({
                    _id: guild.id,
                }, {
                    $set: {
                        _id: guild.id,
                        evalMsgChannel: channel
                    }
                }, {
                    upsert: true,
                })

                response({
                    content: `recruit eval message channel edited to: ${channel}`,
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
                    const cooldownToggle = interaction.options.getBoolean('cooldown') ?? true;
                    const minEvalValue = sponsor === 'None' ? 10 : 8;
                    const recruitMessagesSchema = getRecruitMessagesSchema(handler);
                    const document = await recruitMessagesSchema.findOne({ _id: guild.id });
                    let recruitMember;
                    let recruitDisplayName;
                    let sponsDisplayName;
                    let cooldown;
                    let minEvalDate;
                    try {
                        //find roles in the discord server
                        const recruitRole = guild.roles.cache.find(role => role.name === 'Recruit');
                        const natoRole = guild.roles.cache.find(role => role.name === 'NATO');
                        const newberryRole = guild.roles.cache.find(role => role.name === 'Newberry');
                        recruitMember = await guild.members.fetch(user.id);
                        if (sponsor !== 'None') {
                            const sponsUser = await guild.members.fetch(sponsor.id);
                            sponsDisplayName = sponsUser.displayName;
                        } else {
                            sponsDisplayName = "None";
                        }
                        //add recruit role from the user
                        await recruitMember.roles.add(recruitRole);
                        //add NATO role to the user
                        await recruitMember.roles.add(natoRole);
                        //remove the Newberry role from the user
                        await recruitMember.roles.remove(newberryRole);
                        recruitDisplayName = recruitMember.displayName; // This will be the nickname in the guild, or the username if no nickname is set
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
                    
                    //new logic for cooldown to add a toggle option
                    if (sponsor !== 'None' && cooldownToggle) {
                        // cooldown.setMinutes(currentDate.getMinutes() + 1);
                        cooldown = new Date(currentDate);
                        cooldown.setHours(currentDate.getHours() + 12);
                    } else {
                        cooldown = new Date(currentDate);
                    }
                    
                    if (sponsor !== 'None') {
                        minEvalDate = new Date(currentDate);
                        minEvalDate.setDate(currentDate.getDate() + 7);
                    } else {
                        minEvalDate = new Date(currentDate);
                        minEvalDate.setDate(currentDate.getDate() + 14);
                    }

                    const unixTimestamp = Math.floor(minEvalDate.getTime() / 1000);
                    const cooldownTimestamp = Math.floor(cooldown.getTime() / 1000);
                    const genGreetMsg = document.genGreeting.replaceAll('<MEMBER>', user);
                    const inProcGreetMsg = document.procGreeting.replaceAll('<MEMBER>', user);
                    const eMessage = document.eval.replaceAll('<MEMBER>', recruitDisplayName).replaceAll('<SPONSOR>', sponsDisplayName).replaceAll('<DATE>', `<t:${unixTimestamp}:D>`).replaceAll('<MIN_EVAL>', minEvalValue).replaceAll('<COOLDOWN>', `<t:${cooldownTimestamp}:F>`);
                    const genChannel = await guild.channels.fetch(document.genChannel);
                    const procChannel = await guild.channels.fetch(document.procChannel);
                    const evalChannel = await guild.channels.fetch(document.evalChannel);
                    const roChannel = await guild.channels.fetch(document.roChannel);

                    if (!genChannel || !procChannel || !evalChannel) {
                        response({
                            content: `error sending messages. Incorrect channel ids specified`,
                            ephemeral: true,
                        });
                        return;
                    }

                    try {
                        await recruitMember.send(inProcGreetMsg);
                    } catch {
                        await roChannel.send({
                            content: `Leo Bot attempted to send Recruit \`${recruitMember.displayName}\` the recruit welcome message, but their DMs are closed`
                        });
                    }
                    
                    try { 
                        await genChannel.send(genGreetMsg);
                        await procChannel.send({
                            content: `${recruitDisplayName} has been promoted to recruit and sent to the https://discord.com/channels/1206492396980797480/1214195155910004736`
                        });
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
                                        minEvalDate: minEvalDate.setUTCHours(0, 0, 0, 0),
                                        cooldown: cooldown
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
            } else if (subCommand === 'recruit-eval') {
                const user = interaction.options.getUser('recruited-user');
                const sponsor = interaction.options.getUser('sponsor-user') ?? 'None';
                const cooldownToggle = interaction.options.getBoolean('cooldown') ?? true;
                const minEvalValue = sponsor === 'None' ? 10 : 8;
                const recruitMessagesSchema = getRecruitMessagesSchema(handler);
                const document = await recruitMessagesSchema.findOne({ _id: guild.id });
                let displayName;
                let cooldown;
                let minEvalDate;
                try {
                    //find roles in the discord server
                    const recruitRole = guild.roles.cache.find(role => role.name === 'Recruit');
                    const natoRole = guild.roles.cache.find(role => role.name === 'NATO');
                    const member = await guild.members.fetch(user.id);
                    //add recruit role from the user
                    await member.roles.add(recruitRole);
                    //add NATO role to the user
                    await member.roles.add(natoRole);
                    displayName = member.displayName; // This will be the nickname in the guild, or the username if no nickname is set
                } catch (error) {
                    console.error('Error fetching member:', error);
                }

                if (!document || !document.eval?.length || !document.evalChannel?.length) {
                    response({
                        content: `error. Not all required fields found in the database. Please run /recruit setup first.`,
                        ephemeral: true,
                    });
                    return;
                }

                const currentDate = new Date();
                
                //new logic for cooldown toggle
                if (sponsor !== 'None' && cooldownToggle) {
                    cooldown = new Date(currentDate);
                    cooldown.setHours(currentDate.getHours() + 12);
                } else {
                    cooldown = new Date(currentDate);
                }
                
                if (sponsor !== 'None') {
                    minEvalDate = new Date(currentDate);
                    minEvalDate.setDate(currentDate.getDate() + 7);
                } else {
                    minEvalDate = new Date(currentDate);
                    minEvalDate.setDate(currentDate.getDate() + 14);
                }

                const unixTimestamp = Math.floor(minEvalDate.getTime() / 1000);
                const cooldownTimestamp = Math.floor(cooldown.getTime() / 1000);
                const eMessage = document.eval.replaceAll('<MEMBER>', displayName).replaceAll('<SPONSOR>', sponsor).replaceAll('<DATE>', `<t:${unixTimestamp}:D>`).replaceAll('<MIN_EVAL>', minEvalValue).replaceAll('<COOLDOWN>', `<t:${cooldownTimestamp}:F>`);
                const evalChannel = await guild.channels.fetch(document.evalChannel);

                if (!evalChannel) {
                    response({
                        content: `error sending message. Incorrect channel id specified`,
                        ephemeral: true,
                    });
                    return;
                }

                try {
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
                                    minEvalDate: minEvalDate.setUTCHours(0, 0, 0, 0),
                                    cooldown: cooldown
                                }
                            }
                        },
                        { upsert: true }
                    );
                } catch (err) {
                    response({
                        content: `error sending recruit eval message.`,
                        ephemeral: true,
                    });
                    return;
                }

                response({
                    content: `Recruit eval message sent.`,
                    ephemeral: true,
                });
            } else if (subCommand === 'recruit-promotion') {
                    const user = interaction.options.getUser('promoted-user');
                    const member = await guild.members.fetch(user.id); 
                    const recruitMessagesSchema = getRecruitMessagesSchema(handler);
                    const document = await recruitMessagesSchema.findOne({ _id: guild.id });
                    const roChannel = await guild.channels.fetch(document.roChannel); 

                    if (!document || !document.promotion?.length) {
                        response({
                            content: `promotion-message not found. Please set one with the /recruit edit promotion-message first`,
                            ephemeral: true,
                        });
                        return;
                    }

                    const message = document.promotion.replaceAll('<MEMBER>', member);
                    await recruitMessagesSchema.findOneAndUpdate(
                        { _id: guild.id },
                        {
                            $push: {
                                comparisons: {
                                    memberId: member.id
                                }
                            }
                        },
                        { upsert: true }
                    );

                    try {
                        await user.send({
                            content: `Congratulations! As per the announcement message in https://discord.com/channels/1206492396980797480/1214195155910004736` +`, ` +
                            `you have been promoted to a full NATO member. This means that enough of our members signed ` +
                            `off on you being of NATO quality for you to make it through our recruit evaluation process. ` +
                            `This process exists to ensure that only those who really fit in with our culture get to stay. ` +
                            `We're thrilled to have you!\n\n` +
                            `**__This automated direct message is to inform you of one important note__**, now that you are a full member, ` +
                            `you too get to play a role in recruitment and the recruit evaluation process for NATO if you wish, ` +
                            `__but please avoid disclosing details of the evaluation process to existing and future NRECs__. ` +
                            `We do this so that NRECs display their authentic selves for us to evaluate and don't put on a ` +
                            `performance in order to get their sign offs.\n\n` +
                            `Full details can be found in our recruitment channels, which you now have access to:\n` +
                            `- https://discord.com/channels/1206492396980797480/1216763315783602216\n` +
                            `- https://discord.com/channels/1206492396980797480/1239583143456018512\n` +
                            `    - You can ask any questions you have about the recruitment process here.` +
                            `\n\nWelcome to NATO :saluting_face:`
                        });
                    } catch {
                        await roChannel.send({
                            content: `Leo Bot attempted to send \`${member.displayName}\` the promotion message, but their DMs are closed`
                        });
                    }

                    try {
                        //find roles in the discord server
                        const recruitRole = guild.roles.cache.find(role => role.name === 'Recruit');
                        const fullMemberRole = guild.roles.cache.find(role => role.name === 'Full Member');
                        const soldierRole = guild.roles.cache.find(role => role.name === 'Soldier');
                        //remove recruit role from the user
                        await member.roles.remove(recruitRole);
                        //add full member and soldier role to the user
                        await member.roles.add(fullMemberRole);
                        await member.roles.add(soldierRole);
                    } catch (e) {console.error(e)}
                    response({
                        content: `${message}`,
                        ephemeral: false,
                    });
                }
        } else if (subCommandGroup === 'preview') {
            if (subCommand === 'inprocess-greeting') {
                const member = interaction.options.getUser('recruited-user');
                const recruitMessagesSchema = getRecruitMessagesSchema(handler);
                const document = await recruitMessagesSchema.findOne({ _id: guild.id });

                if (!document || !document.procGreeting?.length) {
                    response({
                        content: `inprocess message not found. Please set one with the /recruit edit inprocess-greeting first`,
                        ephemeral: true,
                    });
                    return;
                }

                const message = document.procGreeting.replaceAll('<MEMBER>', member);
    
                response({
                    content: `${message}`,
                    ephemeral: true,
                });
            } else if (subCommand === 'general-greeting') {
                    const member = interaction.options.getUser('recruited-user');
                    const recruitMessagesSchema = getRecruitMessagesSchema(handler);
                    const document = await recruitMessagesSchema.findOne({ _id: guild.id });

                    if (!document || !document.genGreeting?.length) {
                        response({
                            content: `general greeting message not found. Please set one with the /recruit edit general-greeting`,
                            ephemeral: true,
                        });
                        return;
                    }

                    const message = document.genGreeting.replaceAll('<MEMBER>', member);
        
                    response({
                        content: `${message}`,
                        ephemeral: true,
                    });
            } else if (subCommand === 'eval-message') {
                    const user = interaction.options.getUser('recruited-user');
                    const sponsor = interaction.options.getUser('sponsor-user') ?? 'None';
                    const cooldownToggle = interaction.options.getBoolean('cooldown') ?? true;
                    const minEvalValue = sponsor === 'None' ? 10 : 8;
                    let displayName;
                    let cooldown;
                    let minEvalDate;
                    try {
                            // Fetch the GuildMember object using the user's ID
                            const guild = interaction.guild; // Assuming this is used in a command context where the guild is available
                            const member = await guild.members.fetch(user.id);
                            displayName = member.displayName; // This will be the nickname in the guild, or the username if no nickname is set
                        } catch (error) {
                            console.error('Error fetching member:', error);
                        }
                    const recruitMessagesSchema = getRecruitMessagesSchema(handler);
                    const document = await recruitMessagesSchema.findOne({ _id: guild.id });

                    if (!document || !document.eval?.length) {
                        response({
                            content: `eval message not found. Please set one with the /recruit edit recruit-eval`,
                            ephemeral: true,
                        });
                        return;
                    }

                    const currentDate = new Date();
                    
                    //new cooldown toggle
                    if (sponsor !== 'None' && cooldownToggle) {
                        cooldown = new Date(currentDate);
                        cooldown.setHours(currentDate.getHours() + 12);
                    } else {
                        cooldown = new Date(currentDate);
                    }
                    
                    if (sponsor !== 'None') {
                        minEvalDate = new Date(currentDate);
                        minEvalDate.setDate(currentDate.getDate() + 7);
                    } else {
                        minEvalDate = new Date(currentDate);
                        minEvalDate.setDate(currentDate.getDate() + 14);
                    }

                    const unixTimestamp = Math.floor(minEvalDate.getTime() / 1000);
                    const cooldownTimestamp = Math.floor(cooldown.getTime() / 1000);

                    const message = document.eval.replaceAll('<MEMBER>', displayName).replaceAll('<SPONSOR>', sponsor).replaceAll('<DATE>', `<t:${unixTimestamp}:D>`).replaceAll('<MIN_EVAL>', minEvalValue).replaceAll('<COOLDOWN>', `<t:${cooldownTimestamp}:F>`);
        
                    response({
                        content: `${message}`,
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
                    ephemeral: true,
                });
            }
        } else if (subCommand === 'help') {
            response({
                content: `The recruit command has 4 subcommand groups: setup, edit, send, and preview. Setup will walk users through the entire setup process for the messages. The following placeholders are: <MEMBER> this will replace the part of the message with the recruit (used in all three messages), <DATE> this will replace the part of the message with the current date with 7 days added (min eval of a week)(used in eval message only), <MIN_EVAL> This will replace the part of the message with the number of checks required, 8 for sponsored recruits 10 for non-sponsored(used in eval message only), <SPONSOR> this will replace the part of the message with the sponsored user, or None if no sponsor was provided. (Eval message only), and <COOLDOWN> this will replace the part of the message with the cooldown before evaluations are accepted. using recruit send recruit-welcome will send all three messages, the edit commands are for individually editing the messages, and the preview command will send a preview of the messages in each channel the command is ran, with no restrictions imposed on them.`,
                ephemeral: true,
            });
        }
        
    }
}
