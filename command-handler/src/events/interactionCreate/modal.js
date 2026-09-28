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
            const labelIds = await getGiteaLabelIds(labels);
            await axios.post(`${process.env.ISSUE_REPO}/issues`, 
                {
                    "title": issueTitle,
                    "body": issueDescription,
                    "labels": labelIds,
                    "projects": [1]
                }, {
                headers: {
                    'Authorization': `token ${process.env.REPO_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            });

            interaction.reply({
                content: 'issue created',
                ephemeral: true
            });
        } catch (error) {
            log.error('Error creating issue:', { message: error.message, stack: error.stack });
            interaction.reply({
                content: 'Failed to create the issue',
                ephemeral: true
            });
        }
    }
};

async function getGiteaLabelIds(labelNames) {
    const res = await axios.get(`${process.env.ISSUE_REPO}/labels`, {
        headers: { 'Authorization': `token ${process.env.REPO_TOKEN}` }
    });
    const allLabels = res.data;
    return allLabels
        .filter(l => labelNames.includes(l.name))
        .map(l => l.id);
}
