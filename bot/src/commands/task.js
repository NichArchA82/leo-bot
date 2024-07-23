import CommandTypes from 'command-handler/src/cmd-handler/command-types.js';
import { PermissionFlagsBits } from 'discord.js';
import { recruit, evalTask } from '../tasks/index.js';

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
        }
    ],

    run: async ({ response, handler }) => {
        const subCommand = interaction.options.getSubcommand(false);

        if (!handler.isDbConnected) {
            response({
                content: 'db error: No Connection. Contact developers for help',
                ephemeral: true,
            })

            return;
        }

        if (subCommand === 'eval') {
            evalTask(handler.client, handler);
            response({
                content: 'eval task executed',
                ephemeral: true,
            });
            
        } else if (subCommand === 'recruit') {
            recruit(handler.client, handler);
            response({
                content: `recruit task executed`,
                ephemeral: true
            });
        }
    }
}
