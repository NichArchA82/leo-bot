import { syncModal } from '../../modals/index.js';

export default async ({ eventArgs, handler }) => {
    const [interaction] = eventArgs;

    if (!interaction.isButton()) return;

    if (interaction.customId === 'openOtpModal' || interaction.customId === 'openPlayerInfoModal' || interaction.customId.startsWith('selectPlayer_')) {
        syncModal({ interaction, handler });
    }
};