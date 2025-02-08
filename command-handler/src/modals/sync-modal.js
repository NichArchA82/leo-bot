import axios from 'axios';
import getUserDataSchema from '../schemas/sync-schema.js';
import { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import { userData } from '../temp-storage/userData.js';
export default async ({ interaction, handler }) => {
    if (interaction.customId === 'playerInfoModal') {
        const playerId = interaction.fields.getTextInputValue('player_id');
        const playerDisplayDigits = interaction.fields.getTextInputValue('player_digits');

        const data = await axios.get(`${process.env.HLL_SERVER_URL}/get_player_profile`, {
            headers: {
                'Authorization': `Bearer ${process.env.HLL_API_KEY}`
            },
            params: {
                player_id: playerId
            }
        })
        .catch(error => {
            console.error(error);
            response({
                content: `Error Communicating with the server. Please try again later.`,
                ephemeral: true
            })
            return;
        });

        const displayName = data.data.result.names[0].name;

        // Generate a random 6-digit OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        userData.set(interaction.user.id, { playerId, fullDisplayName: `${displayName}#${playerDisplayDigits}`, storedOtp: otpCode });
        try {
            await axios.post(`${process.env.HLL_SERVER_URL}/message_player`, { 
                player_id: playerId, 
                message: `Leo Bot got a request to link your t17 account with your discord account\nTo continue, please enter your OTP: ${otpCode}\nIf you did not make this request, you can safely ignore this message.` 
            }, {
                headers: { 'Authorization': `Bearer ${process.env.HLL_API_KEY}` }
            });

            const verificationEmbed = new EmbedBuilder()
                .setTitle('Verify Your Player Info')
                .setDescription(`Please verify your details before entering the OTP:`)
                .addFields(
                    { name: 'Player ID', value: `\`${playerId}\`` },
                    { name: 'Display Name', value: `\`${displayName}#${playerDisplayDigits}\`` }
                )
                .setColor('Blue');

            // Create the "Enter OTP" button
            const otpButton = new ButtonBuilder()
                .setCustomId('openOtpModal')
                .setLabel('Enter OTP')
                .setStyle(ButtonStyle.Primary);

            // Send the embed with the button
            await interaction.reply({
                embeds: [verificationEmbed],
                components: [new ActionRowBuilder().addComponents(otpButton)],
                ephemeral: true
            });
        } catch (error) {
            console.error("Error sending OTP:", error.response ? error.response.data : error.message);
            await interaction.reply({ content: 'Failed to send OTP. Try again later.', ephemeral: true });
        }
    } else if (interaction.customId === 'openPlayerInfoModal') {
        const userInfo = userData.get(interaction.user.id);
        const { playerId } = userInfo;
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
    } else if (interaction.customId === 'openOtpModal') {
        const otpModal = new ModalBuilder()
            .setCustomId('otpModal')
            .setTitle('Enter OTP Code');

        const otpInput = new TextInputBuilder()
            .setCustomId('otp_code')
            .setLabel('Enter the OTP sent to you')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        otpModal.addComponents(new ActionRowBuilder().addComponents(otpInput));
        await interaction.showModal(otpModal);
    } else if (interaction.customId === 'otpModal') {
        const userInfo = userData.get(interaction.user.id);
        const { playerId, fullDisplayName, storedOtp } = userInfo;
        const otpCode = interaction.fields.getTextInputValue('otp_code');

        if (!storedOtp) {
            return await interaction.reply({ content: '❌ OTP expired or not found. Please try again.', ephemeral: true });
        }

        if (otpCode === storedOtp) {
            const userDataSchema = getUserDataSchema(handler);
            await userDataSchema.findOneAndUpdate(
                { _id: interaction.guild.id },
                {
                    $push: {
                        users: {
                            discordUserId: interaction.user.id,
                            playerId: playerId
                        }
                    }
                },
                { upsert: true, new: true } 
            );            
            await interaction.reply({ 
                content: `✅ OTP Verified! playerID ${playerId}\ndisplay name ${fullDisplayName}`, 
                ephemeral: true
            });
            userData.delete(interaction.user.id); // Remove OTP after successful verification
        } else {
            await interaction.reply({ content: '❌ Invalid OTP. Try again.', ephemeral: true });
        }
    }
}