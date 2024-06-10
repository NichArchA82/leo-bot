import { ApplicationCommandOptionType, PermissionFlagsBits } from 'discord.js';
import commandTypes from '../cmd-handler/command-types.js';
import getRequiredRolesSchema from '../schemas/required-roles-schema.js';

export default {
    description: 'Sets the required roles for commands',
    type: commandTypes.Slash,
    devCmd: false,
    guildOnly: true,
    permissions: [PermissionFlagsBits.Administrator],
    options: [
        {
            name: 'add',
            description: 'adds command roles to a command',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'command',
                    description: 'The command to set roles',
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    autocomplete: true,
                },
                {
                    name: 'role',
                    description: 'The roles to set',
                    type: ApplicationCommandOptionType.Role,
                    required: true,
                },
            ]
        },
        {
            name: 'remove',
            description: 'removes command roles from a command',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'command',
                    description: 'The command to remove roles from',
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    autocomplete: true,
                },
                {
                    name: 'role',
                    description: 'The roles to remove',
                    type: ApplicationCommandOptionType.Role,
                    required: true,
                },
            ]
        },
        {
            name: 'list',
            description: 'lists all the roles a command has',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'command',
                    description: 'The command to list roles for',
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    autocomplete: true,
                }
            ]
        },
        {
            name: 'clear',
            description: 'removes all command roles from a command',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'command',
                    description: 'The command to remove all roles from',
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    autocomplete: true,
                }
            ]
        },
        {
            name: 'help',
            description: 'displays the help menu for commandroles',
            type: ApplicationCommandOptionType.Subcommand
        }
    ],

    autoComplete: async (interaction, command, name, handler) => {
        let cmds = [];
        const commands = handler.commandHandler.commands.keys();
        const globalCommands = [...(await handler.client.application.commands.fetch()).values()].map(cmd => cmd.name);
        const customCmds = (await handler.commandHandler.customCommands.getCommands()).keys();
        for (const cmd of commands) {
            if (handler.devServers.includes(interaction.guild.id) || globalCommands.includes(cmd)) {
                cmds.push(cmd);
            }
        }

        for (const cmd of customCmds) {
            const parts = cmd.split('-');
            if (interaction.guild.id === parts[0]) {
                cmds.push(parts[1]); // Extract the part after the hyphen
            }
        }
        
        return cmds; 
    },

    run: async ({ handler, interaction, response, guild }) => {
        const subCommand = interaction.options.getSubcommand(false);

        if (!handler.isDbConnected) {
            response({
                content: 'db error: No Connection. Contact developers for help',
                ephemeral: true,
            })

            return;
        }

        if (subCommand === 'add') {
            const commandName = interaction.options.getString('command')
            const _id = `${guild.id}-${commandName}`;
            const role = interaction.options.getRole('role')
            const requiredRoles = getRequiredRolesSchema(handler);
            const alreadyExists = await requiredRoles.findOne({
                _id,
                roles: {
                    $in: [role.id]
                }
            })

            if (alreadyExists) {
                response({
                    content: `The command "${commandName}" already requires the role ${role}`,
                    allowedMentions: {
                        roles: [],
                    },
                    ephemeral: true,
                })
                return;
            }
            await requiredRoles.findOneAndUpdate({
                _id
            }, {
                _id,
                $addToSet: {
                    roles: role
                }
            }, {
                upsert: true
            })

            response({
                content: `The command "${commandName}" now requires the role ${role}`,
                allowedMentions: {
                    roles: [],
                },
                ephemeral: true,
            })
        } else if (subCommand === 'remove') {
            const commandName = interaction.options.getString('command')
            const _id = `${guild.id}-${commandName}`;
            const role = interaction.options.getRole('role')
            const requiredRoles = getRequiredRolesSchema(handler);
            await requiredRoles.findOneAndUpdate({
                _id
            }, {
                _id,
                $pull: {
                    roles: role
                }
            })
            response({
                content: `role ${role} removed from "${commandName}"`,
                allowedMentions: {
                    roles: [],
                },
                ephemeral: true,
            })
        } else if (subCommand === 'list') {
            const commandName = interaction.options.getString('command')
            const _id = `${guild.id}-${commandName}`;
            const requiredRoles = getRequiredRolesSchema(handler);
            const document = await requiredRoles.findById(_id);
            const roles = document && document.roles?.length ? document.roles.map((roleId) => `<@&${roleId}>`).join(', ') : 'No roles';
            response({
                content: `"${commandName}" has the following roles: ${roles}`,
                allowedMentions: {
                    roles: [],
                },
                ephemeral: true,
            })
        } else if (subCommand === 'clear') {
            const commandName = interaction.options.getString('command')
            const _id = `${guild.id}-${commandName}`;
            const requiredRoles = getRequiredRolesSchema(handler);
            await requiredRoles.findByIdAndDelete(_id)
            response({
                content: `"${commandName}" has cleared of all roles`,
                allowedMentions: {
                    roles: [],
                },
                ephemeral: true,
            })
        } else if (subCommand === 'help') {
            response({
                content: `commandroles allows you to set permission roles for all of Leo Bot commands. Leo Bot checks for the default permission of Discord Administrator, but you are able to give users permissions to run specific commands without having to give them the Administrator permission. This command has 4 subcommands, add, remove, list, and clear. add takes two arguments: the command and the role you want assigned to that role, remove takes two arguments: the command and the role you want removed from that command, list takes one argument: the command you want to list all the roles that you have assigned for that command, and clear takes one argument: the command you want to remove all permission roles from.`,
                ephemeral: true,
            })
        }          
    }
}