import url from "url";

import getFiles from "./util/get-files.js";

export default class EventHandler {
    constructor(client, handler, dir) {
        if (!dir) throw new Error('Features directory is required');

        this.loadFeatures(client, handler, dir);
    }

    async loadFeatures(client, handler, dir) {
        const files = getFiles(dir);

        for (const file of files) {
            const filePath = url.pathToFileURL(file);
            const func = (await import(filePath)).default;

            func(client, handler);
        }
    }
}