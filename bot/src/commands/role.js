import { ApplicationCommandOptionType, PermissionFlagsBits } from 'discord.js';
import CommandTypes from 'command-handler/src/cmd-handler/command-types.js';

export default {
    description: 'gives and removes roles from members',
    type: CommandTypes.Slash,
    devCmd: true,
    guildOnly: true,
    permissions: [PermissionFlagsBits.Administrator],
    options: [
        {
            name: 'role',
            description: 'The role to give or remove',
            type: ApplicationCommandOptionType.Role,
            required: true,
        },
    ],

    run: async ({ handler, response, member, args }) => {
        if (!handler.isDbConnected) {
            response({
                content: 'db error: No Connection. Contact developers for help',
                ephemeral: true,
            })

            return;
        }

        const [role] = args;

        if (member.roles.cache.has(role)) {
            try {
                await member.roles.remove(role);
                response({
                    content: `Role <@&${role}> has been removed from you`,
                    allowedMentions: {
                        roles: [],
                    },
                    ephemeral: true,
                })
                return;
            } catch (e) {
                response({
                    content: `Error removing <@&${role}> from you`,
                    allowedMentions: {
                        roles: [],
                    },
                    ephemeral: true,
                })
                return;
            }

        }
        
        try {
            await member.roles.add(role);
            response({
                content: `Role <@&${role}> has been given to you`,
                allowedMentions: {
                    roles: [],
                },
                ephemeral: true,
            })
        } catch (e) {
            response({
                content: `Error giving <@&${role}> to you`,
                allowedMentions: {
                    roles: [],
                },
                ephemeral: true,
            })
        }
    }
}