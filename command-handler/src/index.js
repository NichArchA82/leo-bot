/*
    Command Handler
*/

import EventHandler from './event-handler.js'; // Importing the event handler
import FeatureHandler from './feature-handler.js'; // Importing the feature handler
import cmdHandler from './cmd-handler/command-handler.js'; // Importing the command handler

export default class CommandHandler {
    // Constructor
    constructor({ client, events, featuresDir, devServers = [], devs = [], commandsDir, connection }) {
        // Check if client is provided
        if (!client) throw new Error('Client is required');

        // Set the private properties
        this._client = client; // Set the client
        this._dbConnection = connection; // Set the DB connection
        this._devServers = devServers; // array of dev servers
        this._devs = devs; // array of devs

        // Create an event handler if events are provided
        // pass the client and this instance of the command 
        // handler and the events directory
        if (events) new EventHandler(client, this, events);

        // Create a feature handler if features directory is provided
        // pass the client and this instance of the command handler
        // and the features directory
        if (featuresDir) new FeatureHandler(client, this, featuresDir);

        if (commandsDir) this._commandHandler = new cmdHandler(commandsDir, client, this);
    }

    // Getters for the private properties
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