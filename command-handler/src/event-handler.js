import path from "path";
import url, { fileURLToPath } from "url";

import getFiles from "./util/get-files.js";

export default class EventHandler {
    // <eventName, functions[]>
    _eventListeners = new Map();
    constructor(client, handler, events) {
        if (!events.dir) throw new Error('Events directory is required');

        this.setUp(client, handler, events.dir);
    }

    async setUp(client, handler, dir) {
        await this.loadListeners(dir);
        this.registerEvents(client, handler);
    }

    async loadListeners(dir) {
        const botEvents = getFiles(dir, true);

        const currentFilePath = url.fileURLToPath(import.meta.url);
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
            client.on(event, (...args) => {
                for (const func of functions) {
                    const context = {
                        eventArgs: args,
                        handler
                    };
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