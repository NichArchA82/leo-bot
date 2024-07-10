import { ApplicationCommandOptionType, PermissionFlagsBits } from 'discord.js';
import commandTypes from '../cmd-handler/command-types.js';

export default {
    description: 'Manages messages sent by Leo Bot',
    type: commandTypes.Slash,
    devCmd: false,
    guildOnly: true,
    permissions: [PermissionFlagsBits.Administrator],
    options: [
        {
            name: 'retrieve',
            description: 'retrieves the message content sent by Leo Bot',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'message-id',
                    description: 'The Id of the message',
                    type: ApplicationCommandOptionType.String,
                    required: true,
                },
            ]
        },
        {
            name: 'edit',
            description: 'edits a message sent by Leo Bot',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'message-id',
                    description: 'The Id of the message',
                    type: ApplicationCommandOptionType.String,
                    required: true,
                },
            ]
        },
        {
            name: 'help',
            description: 'displays the help menu for commandroles',
            type: ApplicationCommandOptionType.Subcommand
        }
    ],

    run: async ({ handler, interaction, response, guild }) => {
        const subCommand = interaction.options.getSubcommand(false);

        if (!handler.isDbConnected) {
            response({
                content: 'db error: No Connection. Contact developers for help',
                ephemeral: true,
            })

            return;
        }

        if (subCommand === 'retrieve') {
            try {
                const messageId = interaction.options.getString('message-id');
                const targetMessage = await interaction.channel.messages.fetch(messageId);
                if (targetMessage.author.id !== client.user.id) {
                  response({
                    content: `This message was not sent by Leo Bot`,
                    ephemeral: true,
                  });
                  return;
                }
          
                // Send the old message content in a code block
                response({
                    content: `\`\`\`${targetMessage.content}\`\`\``,
                    ephemeral: true,
                });
              } catch (error) {
                console.error(error);
                response({
                    content: `Failed to retrieve the message. Invalid Id?`,
                    ephemeral: true
                });
              }
        } else if (subCommand === 'edit') {
            try {
                const messageId = interaction.options.getString('message-id');
                const targetMessage = await interaction.channel.messages.fetch(messageId);
                if (targetMessage.author.id !== client.user.id) {
                    response({
                        content: `Error: Leo Bot can only edit it's own messages,`,
                        ephemeral: true
                    });
                    return;
                }
          
                // Edit the message with the new content
                await targetMessage.edit(newContent);
                response({
                    content: `Message edited successfully`,
                    ephemeral: true
                });
              } catch (error) {
                console.error(error);
                response({
                    content: `Failed to edit the message. Invalid Id?`,
                    ephemeral: true
                });
              }
        } else if (subCommand === 'help') {
            response({
                content: `message allows you to edit any of Leo Bot's messages. This command has 2 subcommands: retrieve and edit. retrieve takes one argument: the messageId of the message you want to retrieve, edit takes one argument: the messageId of the message you want to edit. This command must be ran in the channel that contains the message you want to retrieve and edit, and Leo Bot can only edit it's own messages.`,
                ephemeral: true,
            })
        }          
    }
}