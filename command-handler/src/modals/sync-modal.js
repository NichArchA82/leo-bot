import axios from 'axios';
import getUserDataSchema from '../schemas/sync-schema.js';
import { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import { userData } from '../temp-storage/userData.js';

function chunkArray(array, chunkSize) {
    const result = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        result.push(array.slice(i, i + chunkSize));
    }
    return result;
}

export default async ({ interaction, handler }) => {
    if (interaction.customId === 'playerInfoModal') {
        const playerDisplayName = interaction.fields.getTextInputValue('player_displayname');

        const data = await axios.get(`${process.env.HLL_SERVER_URL}/get_players_history`, {
            headers: {
                'Authorization': `Bearer ${process.env.HLL_API_KEY}`
            },
            params: {
                player_name: playerDisplayName.split('#')[0]
            }
        })
        .catch(error => {
            console.error(error);
            interaction.followUp({
                content: `Error Communicating with the server. Please try again later.`,
                ephemeral: true
            })
            return;
        });

        const playerIds = [], buttons = [];
        let index = 1;
        for (const player of data.data.result.players) {
            playerIds.push({ name: `Player ID ${index}`, value: `\`${player.player_id}\`` });
            buttons.push(
                new ButtonBuilder()
                    .setCustomId(`selectPlayer_${player.player_id}`)
                    .setLabel(`Select Player ${index}`)
                    .setStyle(ButtonStyle.Primary)
            );
            index++;
        }
        
        const verificationEmbed = new EmbedBuilder()
            .setTitle('Verify Your Player Info')
            .setDescription(`Please verify your details before entering the OTP:`)
            .addFields(
                playerIds
            )
            .setColor('Blue');

        if (playerIds.length === 1) {
            buttons.pop();
            userData.set(interaction.user.id, { playerId: playerIds[0].value, playerDisplayName });
            // Create the "Enter OTP" button
            buttons.push(
                new ButtonBuilder()
                    .setCustomId('openOtpModal')
                    .setLabel('Enter OTP')
                    .setStyle(ButtonStyle.Primary)
            );
        }

        // Split buttons into chunks of 5
        const buttonChunks = chunkArray(buttons, 5);

        // Map each chunk to a new ActionRowBuilder
        const actionRows = buttonChunks.map(chunk => new ActionRowBuilder().addComponents(chunk));

        // Send the embed with the button
        await interaction.reply({
            embeds: [verificationEmbed],
            components: actionRows,
            ephemeral: true
        }); 
    } else if (interaction.customId.startsWith('selectPlayer_')) {
        const playerId = interaction.customId.split('_')[1];
        const userInfo = userData.get(interaction.user.id) || {};
        userInfo.playerId = playerId;
        userData.set(interaction.user.id, userInfo);

        const verificationEmbed = new EmbedBuilder()
            .setTitle('Verify Your Player Info')
            .setDescription(`Please verify your details before entering the OTP:`)
            .addFields({ name: `Player ID`, value: `\`${playerId}\`` })
            .setColor('Blue');
        
        // Create the "Enter OTP" button
        const otpButton = new ButtonBuilder()
            .setCustomId('openOtpModal')
            .setLabel('Enter OTP')
            .setStyle(ButtonStyle.Primary);

            await interaction.reply({
                embeds: [verificationEmbed],
                components: [new ActionRowBuilder().addComponents(otpButton)],
                ephemeral: true
            }); 
        
    } else if (interaction.customId === 'openPlayerInfoModal') {
        const infoModal = new ModalBuilder()
            .setCustomId('playerInfoModal')
            .setTitle('Enter Your Player Details');

        const playerDisplayName = new TextInputBuilder()
            .setCustomId('player_displayname')
            .setLabel('Enter your t17 display name')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setPlaceholder('Leobot#0000');

            infoModal.addComponents(
                new ActionRowBuilder().addComponents(playerDisplayName)
            );
        await interaction.showModal(infoModal);
    } else if (interaction.customId === 'openOtpModal') {
        // Generate a random 6-digit OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const userInfo = userData.get(interaction.user.id);
        const { playerId } = userInfo;
        try {
            await axios.post(`${process.env.HLL_SERVER_URL}/message_player`, { 
                player_id: playerId, 
                message: `Leo Bot got a request to link your t17 account with your discord account\nTo continue, please enter your OTP: ${otpCode}\nIf you did not make this request, you can safely ignore this message.` 
            }, {
                headers: { 'Authorization': `Bearer ${process.env.HLL_API_KEY}` }
            });
        userData.set(interaction.user.id, { ...userInfo, storedOtp: otpCode });
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
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: '❌ Error sending OTP. Please try again.', ephemeral: true });
        }
    } else if (interaction.customId === 'otpModal') {
        const userInfo = userData.get(interaction.user.id);
        const { playerId, playerDisplayName, storedOtp } = userInfo;
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
                content: `✅ OTP Verified! playerID ${playerId}\ndisplay name ${playerDisplayName}`, 
                ephemeral: true
            });
            userData.delete(interaction.user.id); // Remove OTP after successful verification
        } else {
            await interaction.reply({ content: '❌ Invalid OTP. Try again.', ephemeral: true });
        }
    }
}