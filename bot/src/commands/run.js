import CommandTypes from 'command-handler/src/cmd-handler/command-types.js';
import { PermissionFlagsBits } from 'discord.js';

export default {
    description: 'Run Command',
    type: CommandTypes.Both,
    //devCmd: test only command
    devCmd: true,
    guildOnly: true,
    //devOnly: only the bot developer can use this command
    devOnly: true,
    delete: false,
    reply: false,
    permissions: [PermissionFlagsBits.Administrator],

    run: async ({ response, interaction }) => {
        await interaction.deferReply({ ephemeral: true });

        response({
            content: `Command Ran Successfully!`
        })
    }
}