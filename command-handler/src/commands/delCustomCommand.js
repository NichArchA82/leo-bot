import { ApplicationCommandOptionType, PermissionFlagsBits } from 'discord.js';
import commandTypes from '../cmd-handler/command-types.js';

export default {
    description: 'Deletes a custom command',
    type: commandTypes.Slash,
    devCmd: false,
    guildOnly: true,
    permissions: [PermissionFlagsBits.Administrator],
    options: [
        {
            name: 'command',
            description: 'Custom command to delete',
            required: true,
            type: ApplicationCommandOptionType.String,
            autocomplete: true,
        },
    ],

    autoComplete: async (interaction, command, name, handler) => {
        let cmds = [];
        const customCmds = (await handler.commandHandler.customCommands.getCommands()).keys();
        for (const cmd of customCmds) {
            const parts = cmd.split('-');
            if (interaction.guild.id === parts[0]) {
                cmds.push(parts[1]); // Extract the part after the hyphen
            }
        }
        
        return cmds;
    },
    
    run: async ({ handler, response, args, guild }) => {
        if (!handler.isDbConnected) {
            response({
                content: 'db error: No Connection. Contact developers for help',
                ephemeral: true,
            })

            return;
        }

        const [commandName] = args

        await handler.commandHandler.customCommands.delete(guild.id, commandName)

        response({
            content: `Custom Command \`${commandName}\` Removed`,
            ephemeral: true,
        })
    }
}