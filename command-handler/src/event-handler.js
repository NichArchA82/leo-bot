/*
    Event handler for the bot
    This class is responsible for loading 
    all the event listeners from the events directory
*/

import path from "path";
import url, { fileURLToPath } from "url";

// Get files utility function to get all files in a directory
import getFiles from "./util/get-files.js";

export default class EventHandler {
    // <eventName, functions[]>
    _eventListeners = new Map();
    constructor(client, handler, events) {
        if (!events.dir) throw new Error('Events directory is required');

        // call the setup function to load all the event listeners
        // this is required because the function is async and 
        // we can't have async functions in the constructor
        this.setUp(client, handler, events.dir);
    }

    //setup function to load all the event listeners
    async setUp(client, handler, dir) {
        await this.loadListeners(dir);
        this.registerEvents(client, handler);
    }

    // Load all the event listeners from the events directory
    async loadListeners(dir) {
        // Get all the files in the events directory
        const botEvents = getFiles(dir, true);

        const currentFilePath = fileURLToPath(import.meta.url);
        const currentFileDir = path.dirname(currentFilePath);

        const builtInEvents = getFiles(path.join(currentFileDir, 'events'), true);

        const events = [...botEvents, ...builtInEvents];

        for (const folder of events) {
            const event = path.basename(folder);
            const files = getFiles(folder);
            
            const eventListeners = this._eventListeners.get(event) || [];

            for (const file of files) {
                const filePath = url.pathToFileURL(file);
                const func = (await import(filePath)).default;

                eventListeners.push(func);
            }
            this._eventListeners.set(event, eventListeners);
        }
    }

    registerEvents(client, handler) {
        for (const [event, functions] of this._eventListeners) {
            client.on(event, (...eventArgs) => {
                const context = { eventArgs, handler };
                for (const func of functions) {
                    try {
                        func(context);
                    } catch (e) {
                        console.error(e);
                    }
                }
            });
        }
    }
}