/*
    This command handles all recruit-related functionality, including setup,
    editing messages/channels, sending automated messages, and previews.
    It uses a subcommand handler pattern to keep the code organized and maintainable.
*/

import { ApplicationCommandOptionType, PermissionFlagsBits } from 'discord.js';
import commandTypes from '../cmd-handler/command-types.js';
import getRecruitMessagesSchema from '../schemas/recruit-messages-schema.js';

/**
 * A helper function to update a specific setting in the recruit messages schema.
 * This avoids repeating the same database call for every 'edit' subcommand.
 * @param {object} handler - The command handler instance.
 * @param {string} guildId - The ID of the guild to update.
 * @param {object} updateData - An object containing the fields to update.
 * @returns {Promise<any>} The result of the database operation.
 */
const updateRecruitSetting = async (handler, guildId, updateData) => {
    const recruitMessagesSchema = getRecruitMessagesSchema(handler);
    return recruitMessagesSchema.findOneAndUpdate(
        { _id: guildId },
        { $set: updateData },
        { upsert: true }
    );
};

// This object maps subcommand strings to their handler functions.
// Format for keys: '[subcommandGroup:]subcommand'
const subcommandHandlers = {
    // === SETUP COMMAND ===
    'setup': async ({ interaction, handler, guild, response }) => {
        const updateData = {
            _id: guild.id,
            genGreeting: interaction.options.getString('general-greeting'),
            promotion: interaction.options.getString('recruit-promotion'),
            procGreeting: interaction.options.getString('inprocessing-greeting'),
            eval: interaction.options.getString('recruit-eval'),
            genChannel: interaction.options.getChannel('general-channel').id,
            procChannel: interaction.options.getChannel('inprocess-channel').id,
            evalChannel: interaction.options.getChannel('eval-channel').id,
            evalMsgChannel: interaction.options.getChannel('eval-msg-channel').id,
            roChannel: interaction.options.getChannel('recruit-office-channel').id,
        };
        await updateRecruitSetting(handler, guild.id, updateData);
        response({ content: '✅ Setup complete. All settings have been saved.', ephemeral: true });
    },

    // === EDIT COMMANDS ===
    'edit:inprocess-greeting': async ({ interaction, handler, guild, response }) => {
        const message = interaction.options.getString('message');
        await updateRecruitSetting(handler, guild.id, { procGreeting: message });
        response({ content: `✅ In-process greeting message updated.`, ephemeral: true });
    },
    'edit:recruit-promotion': async ({ interaction, handler, guild, response }) => {
        const message = interaction.options.getString('message');
        await updateRecruitSetting(handler, guild.id, { promotion: message });
        response({ content: `✅ Recruit promotion message updated.`, ephemeral: true });
    },
    'edit:general-greeting': async ({ interaction, handler, guild, response }) => {
        const message = interaction.options.getString('message');
        await updateRecruitSetting(handler, guild.id, { genGreeting: message });
        response({ content: `✅ General greeting message updated.`, ephemeral: true });
    },
    'edit:recruit-eval': async ({ interaction, handler, guild, response }) => {
        const message = interaction.options.getString('message');
        await updateRecruitSetting(handler, guild.id, { eval: message });
        response({ content: `✅ Recruit eval message updated.`, ephemeral: true });
    },
    'edit:inprocess-channel': async ({ interaction, handler, guild, response }) => {
        const channel = interaction.options.getChannel('channel');
        await updateRecruitSetting(handler, guild.id, { procChannel: channel.id });
        response({ content: `✅ In-process channel updated to ${channel}.`, ephemeral: true });
    },
    'edit:general-channel': async ({ interaction, handler, guild, response }) => {
        const channel = interaction.options.getChannel('channel');
        await updateRecruitSetting(handler, guild.id, { genChannel: channel.id });
        response({ content: `✅ General channel updated to ${channel}.`, ephemeral: true });
    },
    'edit:eval-channel': async ({ interaction, handler, guild, response }) => {
        const channel = interaction.options.getChannel('channel');
        await updateRecruitSetting(handler, guild.id, { evalChannel: channel.id });
        response({ content: `✅ Eval channel updated to ${channel}.`, ephemeral: true });
    },
    'edit:eval-msg-channel': async ({ interaction, handler, guild, response }) => {
        const channel = interaction.options.getChannel('channel');
        await updateRecruitSetting(handler, guild.id, { evalMsgChannel: channel.id });
        response({ content: `✅ Eval message channel updated to ${channel}.`, ephemeral: true });
    },
    'edit:recruit-office-channel': async ({ interaction, handler, guild, response }) => {
        const channel = interaction.options.getChannel('channel');
        await updateRecruitSetting(handler, guild.id, { roChannel: channel.id });
        response({ content: `✅ Recruiting office channel updated to ${channel}.`, ephemeral: true });
    },

    // === SEND COMMANDS ===
    'send:recruit-welcome': async ({ interaction, handler, guild, response }) => {
        const user = interaction.options.getUser('recruited-user');
        const sponsor = interaction.options.getUser('sponsor-user') ?? 'None';
        const cooldownToggle = interaction.options.getBoolean('cooldown') ?? true;
        const minEvalValue = sponsor === 'None' ? 10 : 8;
        const recruitMessagesSchema = getRecruitMessagesSchema(handler);
        const document = await recruitMessagesSchema.findOne({ _id: guild.id });
        let recruitMember;
        let recruitDisplayName;
        let sponsDisplayName;
        let cooldown;
        let minEvalDate;
        try {
            //find roles in the discord server
            const recruitRole = guild.roles.cache.find(role => role.name === 'Recruit');
            const natoRole = guild.roles.cache.find(role => role.name === 'NATO');
            const newberryRole = guild.roles.cache.find(role => role.name === 'Newberry');
            recruitMember = await guild.members.fetch(user.id);
            if (sponsor !== 'None') {
                const sponsUser = await guild.members.fetch(sponsor.id);
                sponsDisplayName = sponsUser.displayName;
            } else {
                sponsDisplayName = "None";
            }
            //add recruit role from the user
            await recruitMember.roles.add(recruitRole);
            //add NATO role to the user
            await recruitMember.roles.add(natoRole);
            //remove the Newberry role from the user
            await recruitMember.roles.remove(newberryRole);
            recruitDisplayName = recruitMember.displayName; // This will be the nickname in the guild, or the username if no nickname is set
        } catch (error) {
            console.error('Error fetching member:', error);
        }

        if (!document || !document.genGreeting?.length || !document.procGreeting?.length || !document.eval?.length || !document.genChannel?.length || !document.procChannel?.length || !document.evalChannel?.length) {
            response({
                content: `error. Not all required fields found in the database. Please run /recruit setup first.`,
                ephemeral: true,
            });
            return;
        }

        const currentDate = new Date();
        
        //new logic for cooldown to add a toggle option
        if (sponsor !== 'None' && cooldownToggle) {
            // cooldown.setMinutes(currentDate.getMinutes() + 1);
            cooldown = new Date(currentDate);
            cooldown.setHours(currentDate.getHours() + 12);
        } else {
            cooldown = new Date(currentDate);
        }
        
        if (sponsor !== 'None') {
            minEvalDate = new Date(currentDate);
            minEvalDate.setDate(currentDate.getDate() + 7);
        } else {
            minEvalDate = new Date(currentDate);
            minEvalDate.setDate(currentDate.getDate() + 14);
        }

        const unixTimestamp = Math.floor(minEvalDate.getTime() / 1000);
        const cooldownTimestamp = Math.floor(cooldown.getTime() / 1000);
        const genGreetMsg = document.genGreeting.replaceAll('<MEMBER>', user);
        const inProcGreetMsg = document.procGreeting.replaceAll('<MEMBER>', user);
        const eMessage = document.eval.replaceAll('<MEMBER>', recruitDisplayName).replaceAll('<SPONSOR>', sponsDisplayName).replaceAll('<DATE>', `<t:${unixTimestamp}:D>`).replaceAll('<MIN_EVAL>', minEvalValue).replaceAll('<COOLDOWN>', `<t:${cooldownTimestamp}:F>`);
        const genChannel = await guild.channels.fetch(document.genChannel);
        const procChannel = await guild.channels.fetch(document.procChannel);
        const evalChannel = await guild.channels.fetch(document.evalChannel);
        const roChannel = await guild.channels.fetch(document.roChannel);

        if (!genChannel || !procChannel || !evalChannel) {
            response({
                content: `error sending messages. Incorrect channel ids specified`,
                ephemeral: true,
            });
            return;
        }

        try {
            await recruitMember.send(inProcGreetMsg);
        } catch {
            await roChannel.send({
                content: `Leo Bot attempted to send Recruit \`${recruitMember.displayName}\` the recruit welcome message, but their DMs are closed`
            });
        }
        
        try { 
            await genChannel.send(genGreetMsg);
            await procChannel.send({
                content: `${recruitDisplayName} has been promoted to recruit and sent to the https://discord.com/channels/1206492396980797480/1214195155910004736`
            });
            const evalMsg = await evalChannel.send({
                content: `${eMessage}`,
                allowedMentions: {
                    roles: [],
                    users: [],
                },
            })
            await recruitMessagesSchema.findOneAndUpdate(
                { _id: guild.id },
                {
                    $push: {
                        evalMessages: {
                            messageId: evalMsg.id,
                            sponsorId: typeof sponsor === 'object' ? sponsor.id : 'None',
                            recruitId: user.id,
                            minEvalDate: minEvalDate.setUTCHours(0, 0, 0, 0),
                            cooldown: cooldown
                        }
                    }
                },
                { upsert: true }
            );
        } catch (err) {
            response({
                content: `error sending recruit messages.`,
                ephemeral: true,
            });
            return;
        }

        response({ content: `Recruit messages sent.`, ephemeral: true });
    },
    'send:recruit-eval': async ({ interaction, handler, guild, response }) => {
        const user = interaction.options.getUser('recruited-user');
        const sponsor = interaction.options.getUser('sponsor-user') ?? 'None';
        const cooldownToggle = interaction.options.getBoolean('cooldown') ?? true;
        const minEvalValue = sponsor === 'None' ? 10 : 8;
        const recruitMessagesSchema = getRecruitMessagesSchema(handler);
        const document = await recruitMessagesSchema.findOne({ _id: guild.id });
        let displayName;
        let cooldown;
        let minEvalDate;
        try {
            //find roles in the discord server
            const recruitRole = guild.roles.cache.find(role => role.name === 'Recruit');
            const natoRole = guild.roles.cache.find(role => role.name === 'NATO');
            const member = await guild.members.fetch(user.id);
            //add recruit role from the user
            await member.roles.add(recruitRole);
            //add NATO role to the user
            await member.roles.add(natoRole);
            displayName = member.displayName; // This will be the nickname in the guild, or the username if no nickname is set
        } catch (error) {
            console.error('Error fetching member:', error);
        }

        if (!document || !document.eval?.length || !document.evalChannel?.length) {
            response({
                content: `error. Not all required fields found in the database. Please run /recruit setup first.`,
                ephemeral: true,
            });
            return;
        }

        const currentDate = new Date();
        
        //new logic for cooldown toggle
        if (sponsor !== 'None' && cooldownToggle) {
            cooldown = new Date(currentDate);
            cooldown.setHours(currentDate.getHours() + 12);
        } else {
            cooldown = new Date(currentDate);
        }
        
        if (sponsor !== 'None') {
            minEvalDate = new Date(currentDate);
            minEvalDate.setDate(currentDate.getDate() + 7);
        } else {
            minEvalDate = new Date(currentDate);
            minEvalDate.setDate(currentDate.getDate() + 14);
        }

        const unixTimestamp = Math.floor(minEvalDate.getTime() / 1000);
        const cooldownTimestamp = Math.floor(cooldown.getTime() / 1000);
        const eMessage = document.eval.replaceAll('<MEMBER>', displayName).replaceAll('<SPONSOR>', sponsor).replaceAll('<DATE>', `<t:${unixTimestamp}:D>`).replaceAll('<MIN_EVAL>', minEvalValue).replaceAll('<COOLDOWN>', `<t:${cooldownTimestamp}:F>`);
        const evalChannel = await guild.channels.fetch(document.evalChannel);

        if (!evalChannel) {
            response({
                content: `error sending message. Incorrect channel id specified`,
                ephemeral: true,
            });
            return;
        }

        try {
            const evalMsg = await evalChannel.send({
                content: `${eMessage}`,
                allowedMentions: {
                    roles: [],
                    users: [],
                },
            })
            await recruitMessagesSchema.findOneAndUpdate(
                { _id: guild.id },
                {
                    $push: {
                        evalMessages: {
                            messageId: evalMsg.id,
                            sponsorId: typeof sponsor === 'object' ? sponsor.id : 'None',
                            recruitId: user.id,
                            minEvalDate: minEvalDate.setUTCHours(0, 0, 0, 0),
                            cooldown: cooldown
                        }
                    }
                },
                { upsert: true }
            );
        } catch (err) {
            response({
                content: `error sending recruit eval message.`,
                ephemeral: true,
            });
            return;
        }

        response({ content: `Recruit eval message sent.`, ephemeral: true });
    },
    'send:recruit-promotion': async ({ interaction, handler, guild, response }) => {
        const user = interaction.options.getUser('promoted-user');
        const member = await guild.members.fetch(user.id); 
        const recruitMessagesSchema = getRecruitMessagesSchema(handler);
        const document = await recruitMessagesSchema.findOne({ _id: guild.id });
        const roChannel = await guild.channels.fetch(document.roChannel); 

        if (!document || !document.promotion?.length) {
            response({
                content: `promotion-message not found. Please set one with the /recruit edit promotion-message first`,
                ephemeral: true,
            });
            return;
        }

        const message = document.promotion.replaceAll('<MEMBER>', member);
        await recruitMessagesSchema.findOneAndUpdate(
            { _id: guild.id },
            {
                $push: {
                    comparisons: {
                        memberId: member.id
                    }
                }
            },
            { upsert: true }
        );

        try {
            await user.send({
                content: `Congratulations! As per the announcement message in https://discord.com/channels/1206492396980797480/1214195155910004736` +`, ` +
                `you have been promoted to a full NATO member. This means that enough of our members signed ` +
                `off on you being of NATO quality for you to make it through our recruit evaluation process. ` +
                `This process exists to ensure that only those who really fit in with our culture get to stay. ` +
                `We're thrilled to have you!\n\n` +
                `**__This automated direct message is to inform you of one important note__**, now that you are a full member, ` +
                `you too get to play a role in recruitment and the recruit evaluation process for NATO if you wish, ` +
                `__but please avoid disclosing details of the evaluation process to existing and future NRECs__. ` +
                `We do this so that NRECs display their authentic selves for us to evaluate and don't put on a ` +
                `performance in order to get their sign offs.\n\n` +
                `Full details can be found in our recruitment channels, which you now have access to:\n` +
                `- https://discord.com/channels/1206492396980797480/1216763315783602216\n` +
                `- https://discord.com/channels/1206492396980797480/1239583143456018512\n` +
                `    - You can ask any questions you have about the recruitment process here.` +
                `\n\nWelcome to NATO :saluting_face:`
            });
        } catch {
            await roChannel.send({
                content: `Leo Bot attempted to send \`${member.displayName}\` the promotion message, but their DMs are closed`
            });
        }

        try {
            //find roles in the discord server
            const recruitRole = guild.roles.cache.find(role => role.name === 'Recruit');
            const fullMemberRole = guild.roles.cache.find(role => role.name === 'Full Member');
            const soldierRole = guild.roles.cache.find(role => role.name === 'Soldier');
            //remove recruit role from the user
            await member.roles.remove(recruitRole);
            //add full member and soldier role to the user
            await member.roles.add(fullMemberRole);
            await member.roles.add(soldierRole);
        } catch (e) {console.error(e)}
        response({
            content: `${message}`,
            ephemeral: false,
        });
    },
    
    // === PREVIEW COMMANDS ===
    'preview:inprocess-greeting': async ({ interaction, handler, guild, response }) => {
        const member = interaction.options.getUser('recruited-user');
        const recruitMessagesSchema = getRecruitMessagesSchema(handler);
        const document = await recruitMessagesSchema.findOne({ _id: guild.id });

        if (!document?.procGreeting) {
            return response({ content: 'In-process message not set. Use `/recruit edit inprocess-greeting` first.', ephemeral: true });
        }

        const message = document.procGreeting.replaceAll('<MEMBER>', member);
        response({ content: `**Preview:**\n${message}`, ephemeral: true });
    },
    'preview:general-greeting': async ({ interaction, handler, guild, response }) => {
        const member = interaction.options.getUser('recruited-user');
        const recruitMessagesSchema = getRecruitMessagesSchema(handler);
        const document = await recruitMessagesSchema.findOne({ _id: guild.id });

        if (!document?.genGreeting) {
            return response({ content: 'General greeting message not set. Use `/recruit edit general-greeting` first.', ephemeral: true });
        }

        const message = document.genGreeting.replaceAll('<MEMBER>', member);
        response({ content: `**Preview:**\n${message}`, ephemeral: true });
    },
    'preview:eval-message': async ({ interaction, handler, guild, response }) => {
        const user = interaction.options.getUser('recruited-user');
        const sponsor = interaction.options.getUser('sponsor-user') ?? 'None';
        const cooldownToggle = interaction.options.getBoolean('cooldown') ?? true;
        const minEvalValue = sponsor === 'None' ? 10 : 8;
        let displayName;
        let cooldown;
        let minEvalDate;
        try {
                const member = await guild.members.fetch(user.id);
                displayName = member.displayName; // This will be the nickname in the guild, or the username if no nickname is set
            } catch (error) {
                console.error('Error fetching member:', error);
            }
        const recruitMessagesSchema = getRecruitMessagesSchema(handler);
        const document = await recruitMessagesSchema.findOne({ _id: guild.id });

        if (!document || !document.eval?.length) {
            response({
                content: `eval message not found. Please set one with the /recruit edit recruit-eval`,
                ephemeral: true,
            });
            return;
        }

        const currentDate = new Date();
        
        //new cooldown toggle
        if (sponsor !== 'None' && cooldownToggle) {
            cooldown = new Date(currentDate);
            cooldown.setHours(currentDate.getHours() + 12);
        } else {
            cooldown = new Date(currentDate);
        }
        
        if (sponsor !== 'None') {
            minEvalDate = new Date(currentDate);
            minEvalDate.setDate(currentDate.getDate() + 7);
        } else {
            minEvalDate = new Date(currentDate);
            minEvalDate.setDate(currentDate.getDate() + 14);
        }

        const unixTimestamp = Math.floor(minEvalDate.getTime() / 1000);
        const cooldownTimestamp = Math.floor(cooldown.getTime() / 1000);

        const message = document.eval.replaceAll('<MEMBER>', displayName).replaceAll('<SPONSOR>', sponsor).replaceAll('<DATE>', `<t:${unixTimestamp}:D>`).replaceAll('<MIN_EVAL>', minEvalValue).replaceAll('<COOLDOWN>', `<t:${cooldownTimestamp}:F>`);
                
        response({ content: `**Preview:**\n${message}`, ephemeral: true });
    },
    'preview:recruit-promotion': async ({ interaction, handler, guild, response }) => {
        const member = interaction.options.getUser('promoted-user');
        const recruitMessagesSchema = getRecruitMessagesSchema(handler);
        const document = await recruitMessagesSchema.findOne({ _id: guild.id });

        if (!document?.promotion) {
            return response({ content: 'Promotion message not set. Use `/recruit edit recruit-promotion` first.', ephemeral: true });
        }

        const message = document.promotion.replaceAll('<MEMBER>', member);
        response({ content: `**Preview:**\n${message}`, ephemeral: true });
    },
    
    // === HELP COMMAND ===
    'help': async ({ response }) => {
        response({
            content: `The recruit command has 4 subcommand groups: setup, edit, send, and preview. Setup will walk users through the entire setup process for the messages. The following placeholders are: <MEMBER> this will replace the part of the message with the recruit (used in all three messages), <DATE> this will replace the part of the message with the current date with 7 days added (min eval of a week)(used in eval message only), <MIN_EVAL> This will replace the part of the message with the number of checks required, 8 for sponsored recruits 10 for non-sponsored(used in eval message only), <SPONSOR> this will replace the part of the message with the sponsored user, or None if no sponsor was provided. (Eval message only), and <COOLDOWN> this will replace the part of the message with the cooldown before evaluations are accepted. using recruit send recruit-welcome will send all three messages, the edit commands are for individually editing the messages, and the preview command will send a preview of the messages in each channel the command is ran, with no restrictions imposed on them.`,
            ephemeral: true,
        });
    },
};


export default {
    description: 'Handles recruits',
    type: commandTypes.Slash,
    guildOnly: true,
    permissions: [PermissionFlagsBits.Administrator],
    // The 'options' array remains exactly the same as in your original file.
    options: [
        {
            name: 'setup',
            description: 'setup all messages',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'inprocessing-greeting',
                    description: 'The recruit welcome message to set',
                    type: ApplicationCommandOptionType.String,
                    required: true
                },
                {
                    name: 'recruit-promotion',
                    description: 'The recruit promotion message to set',
                    type: ApplicationCommandOptionType.String,
                    required: true
                },
                {
                    name: 'general-greeting',
                    description: 'The recruit greeting message to set',
                    type: ApplicationCommandOptionType.String,
                    required: true
                },
                {
                    name: 'recruit-eval',
                    description: 'The recruit eval message to set',
                    type: ApplicationCommandOptionType.String,
                    required: true
                },
                {
                    name: 'inprocess-channel',
                    description: 'The new inprocess channel',
                    type: ApplicationCommandOptionType.Channel,
                    required: true,
                },
                {
                    name: 'general-channel',
                    description: 'The new general channel',
                    type: ApplicationCommandOptionType.Channel,
                    required: true,
                },
                {
                    name: 'eval-channel',
                    description: 'The new eval board channel',
                    type: ApplicationCommandOptionType.Channel,
                    required: true,
                },
                {
                    name: 'eval-msg-channel',
                    description: 'The new eval message channel',
                    type: ApplicationCommandOptionType.Channel,
                    required: true,
                },
                {
                    name: 'recruit-office-channel',
                    description: 'The new recruiting office channel',
                    type: ApplicationCommandOptionType.Channel,
                    required: true,
                },
            ]
        },
        {
            name: 'edit',
            description: 'Edit messages and channels',
            type: ApplicationCommandOptionType.SubcommandGroup,
            options: [
                {
                    name: 'inprocess-greeting',
                    description: 'Edit the recruit inprocess greeting',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'message',
                            description: 'The new recruit message',
                            type: ApplicationCommandOptionType.String,
                            required: true,
                        } 
                    ]
                },
                {
                    name: 'recruit-promotion',
                    description: 'Edit the promotion message',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'message',
                            description: 'The new promotion message',
                            type: ApplicationCommandOptionType.String,
                            required: true,
                        } 
                    ]
                },
                {
                    name: 'general-greeting',
                    description: 'Edit the recruit general greeting message',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'message',
                            description: 'The new greeting message',
                            type: ApplicationCommandOptionType.String,
                            required: true,
                        } 
                    ]
                },
                {
                    name: 'recruit-eval',
                    description: 'Edit the recruit message sent in the recruitment board',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'message',
                            description: 'The new eval message',
                            type: ApplicationCommandOptionType.String,
                            required: true,
                        } 
                    ]
                },
                {
                    name: 'inprocess-channel',
                    description: 'Edit the channel that the greeting is sent in',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'channel',
                            description: 'The new greeting channel',
                            type: ApplicationCommandOptionType.Channel,
                            required: true,
                        } 
                    ]
                },
                {
                    name: 'general-channel',
                    description: 'Edit the channel that the welcome is sent in',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'channel',
                            description: 'The new welcome channel',
                            type: ApplicationCommandOptionType.Channel,
                            required: true,
                        } 
                    ]
                },
                {
                    name: 'eval-channel',
                    description: 'Edit the channel that the eval is sent in',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'channel',
                            description: 'The new eval channel',
                            type: ApplicationCommandOptionType.Channel,
                            required: true,
                        } 
                    ]
                },
                {
                    name: 'eval-msg-channel',
                    description: 'Edit the channel that the eval status message is sent in',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'channel',
                            description: 'The new eval channel',
                            type: ApplicationCommandOptionType.Channel,
                            required: true,
                        } 
                    ]
                },
                {
                    name: 'recruit-office-channel',
                    description: 'Edit the channel that the recruit notification is sent in',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'channel',
                            description: 'The new recruiting office channel',
                            type: ApplicationCommandOptionType.Channel,
                            required: true,
                        } 
                    ]
                },
            ]
        },
        {
            name: 'send',
            description: 'Send messages',
            type: ApplicationCommandOptionType.SubcommandGroup,
            options: [
                {
                    name: 'recruit-welcome',
                    description: 'Send recruit message',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'recruited-user',
                            description: 'The new recruit',
                            type: ApplicationCommandOptionType.User,
                            required: true,
                        },
                        {
                            name: 'sponsor-user',
                            description: 'The sponsor of the new recruit',
                            type: ApplicationCommandOptionType.User,
                            required: false,
                        },
                        {
                            name: 'cooldown',
                            description: 'If the cooldown should be applied',
                            type: ApplicationCommandOptionType.Boolean,
                            required: false,
                        }
                    ]
                },
                {
                    name: 'recruit-eval',
                    description: 'Send recruit eval message',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'recruited-user',
                            description: 'The new recruit',
                            type: ApplicationCommandOptionType.User,
                            required: true,
                        },
                        {
                            name: 'sponsor-user',
                            description: 'The sponsor of the new recruit',
                            type: ApplicationCommandOptionType.User,
                            required: false,
                        },
                        {
                            name: 'cooldown',
                            description: 'If the cooldown should be applied',
                            type: ApplicationCommandOptionType.Boolean,
                            required: false,
                        }
                    ]
                },
                {
                    name: 'recruit-promotion',
                    description: 'Send promotion message',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'promoted-user',
                            description: 'promoted member',
                            type: ApplicationCommandOptionType.User,
                            required: true,
                        }
                    ]
                }
            ]
        },
        {
            name: 'preview',
            description: 'preview messages',
            type: ApplicationCommandOptionType.SubcommandGroup,
            options: [
                {
                    name: 'inprocess-greeting',
                    description: 'Send inprocess message in current channel',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'recruited-user',
                            description: 'The new recruit',
                            type: ApplicationCommandOptionType.User,
                            required: true,
                        }
                    ]
                },
                {
                    name: 'general-greeting',
                    description: 'Send the general greeting message in current channel',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'recruited-user',
                            description: 'The new recruit',
                            type: ApplicationCommandOptionType.User,
                            required: true,
                        }
                    ]
                },
                {
                    name: 'eval-message',
                    description: 'Send the eval message in current channel',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'recruited-user',
                            description: 'The new recruit',
                            type: ApplicationCommandOptionType.User,
                            required: true,
                        },
                        {
                            name: 'sponsor-user',
                            description: 'The sponsor of the new recruit',
                            type: ApplicationCommandOptionType.User,
                            required: false,
                        },
                        {
                            name: 'cooldown',
                            description: 'If the cooldown should be applied',
                            type: ApplicationCommandOptionType.Boolean,
                            required: false,
                        }
                    ]
                },
                {
                    name: 'recruit-promotion',
                    description: 'Send promotion message in current channel',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'promoted-user',
                            description: 'promoted member',
                            type: ApplicationCommandOptionType.User,
                            required: true,
                        }
                    ]
                }
            ]
        },
        {
            name: 'help',
            description: 'displays the help menu for commandroles',
            type: ApplicationCommandOptionType.Subcommand
        }
    ],

    run: async ({ handler, interaction, response, guild }) => {
        // 1. Defer the reply to avoid timeout errors
        await interaction.deferReply({ ephemeral: true });

        // 2. Check for database connection
        if (!handler.isDbConnected) {
            return response({
                content: 'DB error: No Connection. Contact developers for help',
                ephemeral: true,
            });
        }
        
        // 3. Determine the handler key from the subcommand group and name
        const subCommandGroup = interaction.options.getSubcommandGroup(false);
        const subCommand = interaction.options.getSubcommand(false);
        const handlerKey = subCommandGroup ? `${subCommandGroup}:${subCommand}` : subCommand;
        
        // 4. Find and execute the corresponding handler function
        const handlerFunc = subcommandHandlers[handlerKey];
        if (handlerFunc) {
            try {
                await handlerFunc({ handler, interaction, response, guild });
            } catch (error) {
                console.error(`Error executing recruit command handler for "${handlerKey}":`, error);
                response({
                    content: 'An unexpected error occurred. Please check the console logs.',
                    ephemeral: true
                });
            }
        } else {
            console.error(`No handler found for recruit command: ${handlerKey}`);
            response({
                content: 'Error: This command action is not configured correctly.',
                ephemeral: true,
            });
        }
    }
};
