import { ApplicationCommandOptionType, PermissionFlagsBits } from 'discord.js';
import commandTypes from '../cmd-handler/command-types.js';
import getPrefixSchema from '../schemas/prefix.schema.js';

export default {
    description: 'Sets default server prefix',
    type: commandTypes.Slash,
    guildOnly: true,
    devCmd: true,
    permissions: [PermissionFlagsBits.Administrator],
    options: [
        {
            name: 'prefix',
            description: 'The prefix to set',
            required: true,
            type: ApplicationCommandOptionType.String,
        }
    ],

    run: async ({ handler, response, text, guild }) => {
        if (!handler.isDbConnected) {
            response({
                content: 'db error: No Connection. Contact developers for help',
                ephemeral: true,
            })

            return;
        }

        const prefixSchema = getPrefixSchema(handler);
        await prefixSchema.findOneAndUpdate({
            _id: guild.id,
        }, {
            _id: guild.id,
            prefix: text,
        }, {
            upsert: true,
        })

        handler.commandHandler.setPrefix(guild.id, text);

        response({
            content: `Set the server prefix to \`${text}\``,
            ephemeral: true,
        })
    }
}