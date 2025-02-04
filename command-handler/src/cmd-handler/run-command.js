import { PermissionFlagsBits } from 'discord.js';
import commandTypes from './command-types.js';
import getRequiredRolesSchema from '../schemas/required-roles-schema.js';

export default async ({
    commandName,
    handler,
    message,
    interaction,
    guild,
    member,
    user,
    args,
    options,
}) => {
    const { commandHandler, devServers, devs } = handler;
    const { commands } = commandHandler;

    const command = commands.get(commandName);

    if (!command || !command.run) {
        handler.commandHandler.customCommands.run(commandName, interaction, guild, member)
        return
    }

    const { devCmd, guildOnly, devOnly, permissions = [], type, reply } = command;
    if (devCmd === true && !devServers.includes(guild?.id)) return;

    const text = args.join(' ');

    const response = (obj) => {
        const { deferReply = true, ...discordObj } = obj; // Remove deferReply before sending
        if (reply === true || obj.ephemeral === true) {
            if (message) message.reply(discordObj);
            else if (interaction && deferReply) interaction.editReply(discordObj);
            else if (interaction && !deferReply) interaction.reply(discordObj);
        } else {
            if (message) message.channel.send(discordObj);
            else if (interaction) {
                interaction.channel.send(discordObj);
                interaction.editReply({ content: 'Message sent', ephemeral: true }).then(() => {
                    interaction.deleteReply();
                });
            }
        }
    };

    if ((guildOnly || permissions.length) && !guild) return;
    
    if (devOnly && !devs.includes(user.id)) return;

    if (message && type === commandTypes.Slash) return;

    //check for permissions
    if (guild){
        const perm = {canRun: true, missingPermissions: []};

        if (permissions.length) {
            const keys = Object.keys(PermissionFlagsBits);
            perm.missingPermissions = [];

            for (const permission of permissions) {
                if (!member.permissions.has(permission)) {
                    perm.canRun = false;
                    const permissionName = keys.find((key) => key === permission || permission === PermissionFlagsBits[key]);
                    perm.missingPermissions.push(permissionName);
                }
            }
        }
        
        const _id = `${guild.id}-${commandName}`;
        const requiredroles = getRequiredRolesSchema(handler);
        const document = await requiredroles.findById(_id);

        if (document) {
            for (const roleId of document.roles) {
                if (member.roles.cache.has(roleId)) {
                    perm.canRun = true;
                    break;
                }
            }
        }
    
        if (perm.canRun === false) {
            if (perm.missingPermissions.length) {
                response({
                    content: `Error: Insufficient Permissions: "${perm.missingPermissions.join('", "')}" OR have one of the following roles: ${document?.roles?.length > 0 ? document.roles.map((roleId) => `<@&${roleId}>`).join(', ') : 'none'}`,
                    allowedMentions: {
                        roles: [],
                    },
                    ephemeral: true,
                    deferReply: false
                });
                return
            }
        }
    }

    command.run({ handler, message, interaction, response, guild, member, user, text, args, options });
};