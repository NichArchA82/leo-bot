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

    run: ({ response }) => {

        response({
            content: `Command Ran Successfully! "Hello World"`
        })
    }
}