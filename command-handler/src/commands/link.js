/*
    This is a command for users to sync their discord account with t17.
*/

import getUserDataSchema from '../schemas/sync-schema.js';
import CommandTypes from '../cmd-handler/command-types.js';
import { ApplicationCommandOptionType, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';
import tesseract from 'tesseract.js';
import sharp from 'sharp';

export default {
    description: 'Sync discord with t17',
    type: CommandTypes.Slash,
    guildOnly: true,
    delete: false,
    reply: true,
    permissions: [PermissionFlagsBits.Administrator],
    options: [
            {
                name: 'image',
                description: 'The settings page screenshot',
                required: true,
                type: ApplicationCommandOptionType.Attachment,
            }
        ],

    run: async ({ response, interaction, handler }) => {
        const attachment = interaction.options.getAttachment('image');
        const imageUrl = attachment.url;
        const imageBuffer = Buffer.from(await fetch(imageUrl).then(res => res.arrayBuffer())); // Convert arrayBuffer to Buffer
        let cropWidth, cropHeight, cropLeft, cropTop;
        const userDataSchema = getUserDataSchema(handler);
        const document = await userDataSchema.findOne({ _id: interaction.guild.id });

        if (document) {
            for (const user of document.users) {
                if (user.discordUserId === interaction.user.id) {
                    return response({
                        content: 'You have already synced your account.',
                        ephemeral: true,
                        deferReply: false
                    });
                }
            }
        }

        const { width, height } = await sharp(imageBuffer).metadata();
      
        if (width === 3840 && height === 2160) { // 4K
            cropWidth = 800; cropHeight = 200; cropLeft = 3040; cropTop = 100;
        } else if (width === 2560 && height === 1440) { // 1440p
            cropWidth = 600; cropHeight = 150; cropLeft = 1960; cropTop = 100;
        } else if (width === 1920 && height === 1080) { // 1080p
            cropWidth = 400; cropHeight = 100; cropLeft = 1470; cropTop = 100;
        } else {
            console.log("Unexpected resolution, attempting a generic crop.");
            cropWidth = Math.floor(width * 0.2);
            cropHeight = Math.floor(height * 0.1);
            cropLeft = width - cropWidth;
            cropTop = 0;
        }

        // Crop, preprocess, and convert to buffer
        const croppedBuffer = await sharp(imageBuffer)
            .extract({ width: cropWidth, height: cropHeight, left: cropLeft, top: cropTop })
            .grayscale()
            .normalise()
            .threshold(150)
            .sharpen()
            .resize(1024)
            .toBuffer();
        
        const { data: { text } } = await tesseract.recognize(croppedBuffer, 'eng', {
            tessedit_char_whitelist: 'abcdefghjkmnopqrstuvwxyz0123456789',
            oem: 3,
            tessedit_pageseg_mode: 6
        });
              
        // Match the Player ID that follows "PLAYER ID : "
        const playerIdMatch = text.match(/PLAYER ID :\s*([a-zA-Z0-9]{32})/);
        let playerId = playerIdMatch[1];
        playerId = playerId.replace(/l/g, '1').replace(/o/g, '0');

        const infoModal = new ModalBuilder()
            .setCustomId('playerInfoModal')
            .setTitle('Enter Your Player Details');

        const playerIdInput = new TextInputBuilder()
            .setCustomId('player_id')
            .setLabel('Player ID (Verify it is correct)')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setValue(playerId);

        const playerDisplayDigits = new TextInputBuilder()
            .setCustomId('player_digits')
            .setLabel('4 digits in your display name (exlude the #)')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setPlaceholder('0000');

            infoModal.addComponents(
                new ActionRowBuilder().addComponents(playerIdInput),
                new ActionRowBuilder().addComponents(playerDisplayDigits)
            );
        await interaction.showModal(infoModal);
    },
}