import { Client, IntentsBitField, Partials } from 'discord.js';
import CH from 'command-handler';
import logger from 'command-handler/src/util/logger.js';
import path from 'path';
import mongoose from 'mongoose';
import 'dotenv/config';
import 'server';

const log = logger();
//Initialize the client with the intents and partials that the bot will use
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

//When the bot is ready, connect to the database and initialize the command handler
client.once('ready', async () => {
    log.info('Bot is ready');

    const connection = await mongoose.connect(process.env.MONGO_URI);

    //Initialize the command handler
    new CH({
        //passing the client to the command handler
        client,
        //directory where the events are located
        events: {
            dir: path.join(process.cwd(), 'src', 'events')
        },
        //directory where the features are located
        featuresDir: path.join(process.cwd(), 'src', 'features'),
        //directory where the commands are located
        commandsDir: path.join(process.cwd(), 'src', 'commands'),
        //array of developer servers. The bot will only respond to dev commands in these servers
        devServers: process.env.DEV_SERVERS.split(',').map(server => server.trim()).filter(server => server),
        //array of developer users. The bot will only respond to devOnly commands from these users
        devs: process.env.DEVS.split(',').map(dev => dev.trim()).filter(dev => dev),
        //database connection
        connection,
    });
});

//Login to the bot
client.login(process.env.BOT_TOKEN);