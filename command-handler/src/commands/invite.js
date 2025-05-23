import { ApplicationCommandOptionType, PermissionFlagsBits } from 'discord.js';
import commandTypes from '../cmd-handler/command-types.js';

export default {
    description: 'Creates a One time invite that expires in a week',
    type: commandTypes.Slash,
    devCmd: false,
    guildOnly: true,
    permissions: [PermissionFlagsBits.Administrator],
    options: [
        {
            name: 'sponsor',
            description: 'The sponsor to dm the link to',
            type: ApplicationCommandOptionType.User,
            required: false,
        },
    ],

    run: async ({ interaction, response, args, guild }) => {
        await interaction.deferReply({ ephemeral: true });
        
        const [sponsor] = (args && args.length > 0) ? args : ['None'];
        const maxAge = 7 * 24 * 60 * 60; // 1 week
        let invite;
        try {
            invite = await interaction.guild.invites.create(interaction.channel.id, {
            maxAge: maxAge,
            maxUses: 1,
            unique: true,
            });
        } catch {
            response({
                content: `Error creating invite. Please make sure it is ran in a valid text channel for invite channel. Threads and Forum channels are not valid`,
                ephemeral: true
            });
            return;
        }
        if (sponsor === 'None') {
            response({
                content: `${invite.url}`,
                ephemeral: true,
            });
        } else {
            try {
                const member = await guild.members.fetch(sponsor);
                await member.send({
                    content: `${invite.url}`
                });
                response({
                    content: `${member} was sent invite: ${invite.url}`,
                    allowedMentions: {
                        roles: [],
                        users: []
                    },
                    ephemeral: true,
                });
            } catch {
                response({
                    content: `Error sending invite: ${invite.url}`,
                    allowedMentions: {
                        roles: [],
                        users: []
                    },
                    ephemeral: true,
                });  
            }
        }
    }
}