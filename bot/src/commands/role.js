/*
    This command is used to give and remove roles from members.
*/
import { ApplicationCommandOptionType, PermissionFlagsBits } from 'discord.js';
import CommandTypes from 'command-handler/src/cmd-handler/command-types.js';

export default {
    description: 'gives and removes roles from members',
    type: CommandTypes.Slash,
    //devCmd this command is only for developers
    devCmd: true,
    //guildOnly this command can only be used in guilds
    guildOnly: true,
    //permissions the user must have the administrator permission by default
    //Command-roles allows you to set a role that can use the command
    permissions: [PermissionFlagsBits.Administrator],
    //options that the command expects when executed
    options: [
        {
            name: 'role',
            description: 'The role to give or remove',
            type: ApplicationCommandOptionType.Role,
            required: true,
        },
    ],

    //run function that is executed when the command is used
    //handler is the command handler, response is the response object, 
    // member is the member that used the command, 
    // args are the arguments passed to the command, interaction is the interaction object
    run: async ({ handler, response, member, args, interaction }) => {
        //deferReply is used to acknowledge the command
        //ephemeral is used to make the response only visible to the user who used the command
        //the command will be responded to later.
        await interaction.deferReply({ ephemeral: true });  

        //check if the database is connected
        //if not, respond with an error message
        if (!handler.isDbConnected) {
            response({
                content: 'db error: No Connection. Contact developers for help',
                ephemeral: true,
            });

            return;
        }

        //destructure the role from the args
        const [role] = args;

        //check if the member has the role
        //if they do, remove the role
        if (member.roles.cache.has(role)) {
            try {
                await member.roles.remove(role);
                response({
                    content: `Role <@&${role}> has been removed from you`,
                    //allowedMentions is used to prevent the bot from mentioning the role
                    allowedMentions: {
                        roles: [],
                    },
                    ephemeral: true,
                });
                return;
            } catch (e) {
                //if there is an error, respond with an error message
                response({
                    content: `Error removing <@&${role}> from you`,
                    allowedMentions: {
                        roles: [],
                    },
                    ephemeral: true,
                });
                return;
            }

        }
        
        //if the member does not have the role, give the role
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