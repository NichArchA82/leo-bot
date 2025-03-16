/*
    This is a command for users to sync their discord account with t17.
*/

import getUserDataSchema from '../schemas/sync-schema.js';
import CommandTypes from '../cmd-handler/command-types.js';
import { 
    PermissionFlagsBits,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder
} from 'discord.js';

export default {
    description: 'Sync discord with t17',
    type: CommandTypes.Slash,
    guildOnly: true,
    delete: false,
    reply: true,
    permissions: [PermissionFlagsBits.Administrator],

    run: async ({ response, interaction, handler }) => {
        await interaction.deferReply({ ephemeral: true });
        const userDataSchema = getUserDataSchema(handler);
        const document = await userDataSchema.findOne({ _id: interaction.guild.id });

        if (document) {
            for (const user of document.users) {
                if (user.discordUserId === interaction.user.id) {
                    return response({
                        content: 'You have already synced your account.',
                        ephemeral: true,
                    });
                }
            }
        }
    
        const detailsButton = new ButtonBuilder()
            .setCustomId('openPlayerInfoModal')
            .setLabel('Open form to enter player details')
            .setStyle(ButtonStyle.Primary);

        await interaction.followUp({
            components: [new ActionRowBuilder().addComponents(detailsButton)]
        });
    },
}