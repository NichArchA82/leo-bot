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
            name: 'create',
            description: 'create a custom command',
            type: ApplicationCommandOptionType.Subcommand,
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
                    description: 'If the bot should reply to the interaction, or send the message in the channel',
                    required: true,
                    type: ApplicationCommandOptionType.Boolean,
                }
            ]
        },
        {
            name: 'delete',
            description: 'delete a custom command',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'command',
                    description: 'Custom command to delete',
                    required: true,
                    type: ApplicationCommandOptionType.String,
                    autocomplete: true,
                },
            ]
        },
        {
            name: 'list',
            description: 'lists all the custom commands',
            type: ApplicationCommandOptionType.Subcommand
        },
        {
            name: 'help',
            description: 'displays the help menu for commandroles',
            type: ApplicationCommandOptionType.Subcommand
        }
    ],

    autoComplete: async (interaction, command, name, handler) => {
        const subCommand = interaction.options.getSubcommand(false);
        if (subCommand === 'delete') {
            let cmds = [];
            const customCmds = (await handler.commandHandler.customCommands.getCommands()).keys();
            for (const cmd of customCmds) {
                const parts = cmd.split('-');
                if (interaction.guild.id === parts[0]) {
                    cmds.push(parts[1]); // Extract the part after the hyphen
                }
            }
            
            return cmds;
        }
    },

    run: async ({ handler, interaction, response, args, guild, member }) => {
        const subCommand = interaction.options.getSubcommand(false);

        if (!handler.isDbConnected) {
            response({
                content: 'db error: No Connection. Contact developers for help',
                ephemeral: true,
            })

            return;
        }


        if (subCommand === 'create') {
            const commandName = interaction.options.getString('name');
            const desc = interaction.options.getString('description');
            const resp = interaction.options.getString('response');
            const reply = interaction.options.getBoolean('reply');
        
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
        } else if (subCommand === 'delete') {
            const commandName = interaction.options.getString('command');

            await handler.commandHandler.customCommands.delete(guild.id, commandName)

            response({
                content: `Custom Command \`${commandName}\` Removed`,
                ephemeral: true,
            })
        } else if (subCommand === 'list') {
            let cmds = [];
            const customCmds = (await handler.commandHandler.customCommands.getCommands()).keys();
            for (const cmd of customCmds) {
                const parts = cmd.split('-');
                if (interaction.guild.id === parts[0]) {
                    cmds.push(parts[1]); // Extract the part after the hyphen
                }
            }
            response({
                content: `The server has the following Custom Commands: \`${cmds.join('\`, \`')}\``,
                ephemeral: true,
            })
        } else if (subCommand === 'help') {
            response({
                content: `customcommand allows you to create your own commands that return a text response. This command has 3 subcommands: create, delete, and list. create takes 4 arguments: name, description, response, and reply. name is what the name of the new slash command will be registered as. The name has to follow discord slash command name rules such as not containing spaces or having any uppercase letters. description will be the description of the new command you are creating, response is text response the command will return when executed. Reply is a true or false value on whether you want to command to reply to the interaction, i.e. User used command, or if it should just send the response in the channel. Note: Discord expects replies to interactions, so if this is false, it will reply to the interaction with a ephemeral message, delete the reply, then send the response in the channel.`,
                ephemeral: true,
            })
        }
    }
}