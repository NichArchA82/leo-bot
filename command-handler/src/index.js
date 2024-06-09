import EventHandler from './event-handler.js';
import FeatureHandler from './feature-handler.js';
import cmdHandler from './cmd-handler/command-handler.js';

export default class CommandHandler {
    constructor({ client, events, featuresDir, devServers = [], devs = [], commandsDir, connection }) {
        if (!client) throw new Error('Client is required');

        this._client = client;
        this._dbConnection = connection;

        if (events) new EventHandler(client, this, events);

        if (featuresDir) new FeatureHandler(client, this, featuresDir);

        this._devServers = devServers;
        this._devs = devs;

        if (commandsDir) this._commandHandler = new cmdHandler(commandsDir, client, this);

    }

    get client() {
        return this._client;
    }
    
    get commandHandler() {
        return this._commandHandler;
    }

    get devServers() {
        return this._devServers;
    }

    get devs() {
        return this._devs;
    }

    get dbConnection() {
        return this._dbConnection;
    }
    
    get isDbConnected() {
        return !!this._dbConnection;
    }
}