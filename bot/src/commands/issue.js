/*
    This command is used to report issues with Leo Bot to GitHub
*/

import CommandTypes from 'command-handler/src/cmd-handler/command-types.js';
import { ApplicationCommandOptionType, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';

export default {
    description: 'Report issues with Leo Bot',
    type: CommandTypes.Slash,
    guildOnly: true,
    permissions: [PermissionFlagsBits.Administrator],
    options: [
        {
            name: 'issue-type',
            description: 'Type of the issue',
            type: ApplicationCommandOptionType.String,
            autocomplete: true,
            required: true
        }
    ],

    autoComplete: () => {
        return ['bug', 'enhancement'];
    },

    run: async ({ response, handler, interaction }) => {
        const issue = interaction.options.getString('issue-type');
        //check if the database is connected
        if (!handler.isDbConnected) {
            response({
                content: 'db error: No Connection. Contact developers for help',
                ephemeral: true,
            });

            return;
        }

        const issueModal = new ModalBuilder()
            .setCustomId('issueModal')
            .setTitle('Report an issue with Leo Bot');

        const issueTitle = new TextInputBuilder()
            .setCustomId('issue_title')
            .setLabel('Enter your issue title')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)

        const issueDescription = new TextInputBuilder()
            .setCustomId('issue_description')
            .setLabel('Enter your issue description')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)

        const issueType = new TextInputBuilder()
            .setCustomId('issue_type')
            .setLabel('Enter the type of issue')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setValue(issue)

            issueModal.addComponents(
                new ActionRowBuilder().addComponents(issueTitle),
                new ActionRowBuilder().addComponents(issueDescription),
                new ActionRowBuilder().addComponents(issueType)
            );
        await interaction.showModal(issueModal);
    }
}
