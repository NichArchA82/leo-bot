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
            required: false,
        },
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

    run: async ({ handler, response, args, guild }) => {
        if (!handler.isDbConnected) {
            response({
                content: 'db error: No Connection. Contact developers for help',
                ephemeral: true,
            })

            return;
        }

        const [commandName, role] = args;
        const command = (handler.commandHandler.commands.get(commandName));
        const customCmd = (await handler.commandHandler.customCommands.getCommands()).keys(commandName);
        if (command || customCmd) {
            const _id = `${guild.id}-${commandName}`;

            if (!role) {
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
                return;
            }

            const requiredRoles = getRequiredRolesSchema(handler);
            const alreadyExists = await requiredRoles.findOne({
                _id,
                roles: {
                    $in: [role]
                }
            })

            if (alreadyExists) {
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
                    content: `role <@&${role}> removed from "${commandName}"`,
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
                content: `The command "${commandName}" now requires the role <@&${role}>`,
                allowedMentions: {
                    roles: [],
                },
                ephemeral: true,
            })
        }
    }
}