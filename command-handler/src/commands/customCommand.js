import { ApplicationCommandOptionType, PermissionFlagsBits } from 'discord.js';
import commandTypes from '../cmd-handler/command-types.js';

export default {
    description: 'Creates a custom command',
    type: commandTypes.Slash,
    devCmd: false,
    guildOnly: true,
    permissions: [PermissionFlagsBits.Administrator],
    options: [
        {
            name: 'name',
            description: 'The name of the command (cannot contain spaces or uppercase letters)',
            required: true,
            type: ApplicationCommandOptionType.String,
        },
        {
            name: 'description',
            description: 'The description of the command',
            required: true,
            type: ApplicationCommandOptionType.String,
        },
        {
            name: 'response',
            description: 'The response the command will have',
            required: true,
            type: ApplicationCommandOptionType.String,
        },
        {
            name: 'reply',
            description: 'If the server should reply or send the message',
            required: true,
            type: ApplicationCommandOptionType.Boolean,
        }
    ],

    run: async ({ handler, response, args, guild, member }) => {
        if (!handler.isDbConnected) {
            response({
                content: 'db error: No Connection. Contact developers for help',
                ephemeral: true,
            })

            return;
        }

        const [commandName, desc, resp, reply] = args
        
        const invalidCommand = /\s/.test(commandName.toLowerCase());

        if (invalidCommand) {
            response({
                content: `Custom Command \`${commandName.toLowerCase()}\` Invalid. Cannot contain spaces in name.`,
                ephemeral: true,
            })
            return;
        }

        handler.commandHandler.customCommands.create(guild.id, commandName.toLowerCase(), desc, resp, member, reply)

        response({
            content: `Custom Command \`${commandName.toLowerCase()}\` Created`,
            ephemeral: true,
        })
    }
}