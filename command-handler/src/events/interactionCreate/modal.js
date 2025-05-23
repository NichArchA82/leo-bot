import { InteractionType } from 'discord.js';
import axios from 'axios';
import 'dotenv/config';
import logger from '../../util/logger.js';

const log = logger();

export default async ({ eventArgs, handler }) => {
    const [interaction] = eventArgs;

    if (interaction.type !== InteractionType.ModalSubmit) return;

    if (interaction.customId === 'issueModal') {
        const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
        const displayName = member?.displayName || interaction.user.displayName;
        const issueTitle = interaction.fields.getTextInputValue('issue_title');
        const issueDescription = interaction.fields.getTextInputValue('issue_description') +
            `\n\n---\n\nThis issue was opened by ${displayName} ` + 
            `from ${interaction.client.user.username} in ${interaction.guild?.name}`;
        const issueType = interaction.fields.getTextInputValue('issue_type');
        const labels = issueType ? [ issueType, 'leo-bot' ] : [ 'leo-bot' ];

        try {
            await axios.post(`https://api.github.com/repos/${process.env.ISSUE_REPO}/issues`, 
                {
                    "title": issueTitle,
                    "body": issueDescription,
                    "labels": labels
                }, {
                headers: {
                    'Authorization': `token ${process.env.GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                }
            });

            interaction.reply({
                content: 'issue created',
                ephemeral: true
            });
        } catch (error) {
            log.error('Error creating issue in GitHub', { message: error.message, stack: error.stack });
            interaction.reply({
                content: 'Failed to create the issue',
                ephemeral: true
            });
        }
    }
};