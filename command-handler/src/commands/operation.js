import axios from 'axios';
import { ApplicationCommandOptionType, PermissionFlagsBits, ChannelType } from 'discord.js';
import commandTypes from '../cmd-handler/command-types.js';
import getOperationsSchema from '../schemas/operations.schema.js';

export default {
    description: 'Setup operation plugin',
    type: commandTypes.Slash,
    devCmd: false,
    guildOnly: true,
    permissions: [PermissionFlagsBits.Administrator],
    options: [
        {
            name: 'start',
            description: 'begin tracking an event',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'event-id',
                    description: 'eventId from roster bot',
                    type: ApplicationCommandOptionType.String,
                    required: true
                }
            ]
        },
        {
            name: 'end',
            description: 'delete all threads and stop event tracking',
            type: ApplicationCommandOptionType.Subcommand,
        }
    ],

    run: async ({ handler, response, guild, interaction }) => {
        const subCommand = interaction.options.getSubcommand(false);

        if (!handler.isDbConnected) {
            response({
                content: 'db error: No Connection. Contact developers for help',
                ephemeral: true,
            })

            return;
        }

        if (subCommand === 'start') {
            const eventId = interaction.options.getString('event-id')

            const id = `${guild.id}-${eventId}`;
            const operationsSchema = getOperationsSchema(handler);

            try {
                await axios.get(`https://raid-helper.dev/api/v2/events/${eventId}`);
            } catch {
                response({
                    content: 'event-id invalid. Please try again.',
                    ephemeral: true,
                })
                return;
            }
            
            try {
                const commandThread = await interaction.channel.threads.create({
                name: `Command`,
                type: ChannelType.PrivateThread,
                invitable: true, // Allows anyone in the thread to invite others
                autoArchiveDuration: 10080, // Sets auto-archive duration to 1 week
                });

                const commsThread = await interaction.channel.threads.create({
                    name: `COMMS`,
                    invitable: true, // Allows anyone in the thread to invite others
                    autoArchiveDuration: 10080, // Sets auto-archive duration to 1 week
                    });
    
            await operationsSchema.findOneAndUpdate({
                _id: id,
            }, {
                _id: id,
                channel: interaction.channel.id,
                eventId: eventId,
                $push: {
                    threads: {
                        $each: [
                            { threadId: commandThread.id, threadName: 'Command' },
                            { threadId: commsThread.id, threadName: 'COMMS' }
                          ]
                    }
                }
            }, {
                upsert: true,
            })

            response({
                content: 'event setup',
                ephemeral: true,
            })
            } catch (error){
                console.error(error)
                response({
                    content: 'setup error',
                    ephemeral: true,
                })
            }
        } else if (subCommand === 'end') {
            const operationsSchema = getOperationsSchema(handler);
            let document = await operationsSchema.findOne({ channel: interaction.channel.id });
            if (!document) {
                response({
                    content: `No event has been started in this channel`,
                    ephemeral: true
                });
                return;
            }
            for (const thread of document.threads) {
                const threadChannel = await handler.client.channels.fetch(thread.threadId);
                await threadChannel.delete();
            }
            await operationsSchema.deleteOne({ channel: interaction.channel.id });

            response({
                content: `All threads have been deleted and tracking disabled`,
                ephemeral: true
            })
        }
    }
}