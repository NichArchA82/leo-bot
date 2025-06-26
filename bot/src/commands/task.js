/*
    This command is used to run scheduled tasks on command.
*/

import CommandTypes from 'command-handler/src/cmd-handler/command-types.js';
import { ApplicationCommandOptionType, PermissionFlagsBits } from 'discord.js';
//import the tasks denfined in the tasks folder.
import { recruit, evalTask, channelPurge } from '../tasks/index.js';

export default {
    description: 'Run scheduled tasks on command',
    type: CommandTypes.Slash,
    guildOnly: true,
    permissions: [PermissionFlagsBits.Administrator],
    options: [
        {
            name: 'eval',
            description: 'run the eval task',
            type: ApplicationCommandOptionType.Subcommand,
        },
        {
            name: 'recruit',
            description: 'run the recruit task',
            type: ApplicationCommandOptionType.Subcommand,
        },
        {
            name: 'channel-purge',
            description: 'run the channel purge task',
            type: ApplicationCommandOptionType.Subcommand,
        }
    ],

    run: async ({ response, handler, interaction }) => {
        //deferReply is used to acknowledge the command
        await interaction.deferReply({ ephemeral: true });
        
        //get the subcommand that was used
        const subCommand = interaction.options.getSubcommand(false);

        //check if the database is connected
        if (!handler.isDbConnected) {
            response({
                content: 'db error: No Connection. Contact developers for help',
                ephemeral: true,
            });

            return;
        }

        // Define a dictionary to map subcommands to their respective functions
        const subCommandHandlers = {
            eval: () => {
                evalTask({ client: handler.client, handler, guildID: interaction.guildId });
                response({
                    content: 'eval task executed',
                    ephemeral: true,
                });
            },
            recruit: () => {
                recruit({ client: handler.client, handler, guildID: interaction.guildId });
                response({
                    content: 'recruit task executed',
                    ephemeral: true,
                });
            },
            'channel-purge': () => {
                channelPurge({ client: handler.client, handler, channel: interaction.channelId });
                response({
                    content: 'channel is now being purged of all messages that are not pinned and older than the current date',
                    ephemeral: true,
                });
            }
        };

        // Execute the corresponding function for the subcommand
        if (subCommandHandlers[subCommand]) {
            subCommandHandlers[subCommand]();
        } else {
            response({
                content: 'Unknown subcommand',
                ephemeral: true,
            });
        }
    }
}
