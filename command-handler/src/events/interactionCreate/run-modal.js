import { InteractionType } from 'discord.js';
import { syncModal } from '../../modals/index.js';

export default async ({ eventArgs, handler }) => {
    const [interaction] = eventArgs;

    if (interaction.type !== InteractionType.ModalSubmit) return;

    if (interaction.customId === 'playerInfoModal' || interaction.customId === 'otpModal') {
        syncModal({ interaction, handler });
    }
};