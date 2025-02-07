import { syncModal } from '../../modals/index.js';

export default async ({ eventArgs, handler }) => {
    const [interaction] = eventArgs;

    if (!interaction.isButton()) return;

    if (interaction.customId === 'openOtpModal') {
        syncModal({ interaction, handler });
    }
};