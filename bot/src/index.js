import { Client, IntentsBitField, Partials } from 'discord.js';
import CH from 'command-handler';
import path from 'path';
import mongoose from 'mongoose';
import 'dotenv/config';
// import 'server';

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.DirectMessages,
        IntentsBitField.Flags.GuildMessageReactions,
        IntentsBitField.Flags.DirectMessageReactions,
    ],
    partials: [
        Partials.Channel,
        Partials.Message,
        Partials.Reaction,
    ]
});

client.once('ready', async () => {
    console.log('Bot is ready');

    const connection = await mongoose.connect(process.env.MONGO_URI);

    new CH({
        client,
        events: {
            dir: path.join(process.cwd(), 'src', 'events')
        },
        featuresDir: path.join(process.cwd(), 'src', 'features'),
        commandsDir: path.join(process.cwd(), 'src', 'commands'),
        devServers: process.env.DEV_SERVERS.split(',').map(server => server.trim()).filter(server => server),
        devs: process.env.DEVS.split(',').map(dev => dev.trim()).filter(dev => dev),
        connection,
    });
});

client.login(process.env.BOT_TOKEN);