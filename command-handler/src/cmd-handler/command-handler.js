import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

import getFiles from '../util/get-files.js';
import SlashCommands from './slash-commands.js';
import commandTypes from './command-types.js';
import getPrefixSchema from '../schemas/prefix.schema.js'
import CustomCommands from './CustomCommands.js';

export default class CommandHandler {
    //<commandName, commandObject>
    _commands = new Map();
    // <guildId, prefix>
    _prefixes = new Map();

    constructor(commandsDir, client, handler) {
        if (!commandsDir) throw new Error('Commands directory is required');

        this._slashCommands = new SlashCommands(client);
        this._customCommands = new CustomCommands(handler);
        this.init(commandsDir, handler);
    }

    get commands() {
        return this._commands;
    }

    getPrefix(guildId) {
        return this._prefixes.get(guildId) || '!';
    }

    setPrefix(guildId, prefix) {
        this._prefixes.set(guildId, prefix);
    }

    get slashCommands() {
        return this._slashCommands;
    }

    get customCommands() {
        return this._customCommands;
    }

    async loadPrefixes(handler) {
        if (!handler.isDbConnected) return;
        const prefixSchema = getPrefixSchema(handler);

        const prefixes = await prefixSchema.find();

        for (const { _id, prefix } of prefixes) {
            this.setPrefix(_id, prefix);
        }
    }

    async init(commandsDir, handler) {
        this.loadPrefixes(handler);
        const registeredCommands = [];
        const botCommands = getFiles(commandsDir);
        const currentFilePath = fileURLToPath(import.meta.url);
        const currentFileDir = path.dirname(currentFilePath);
        const builtInCommands = getFiles(path.join(currentFileDir, '..', 'commands'));
        const commands = [...botCommands, ...builtInCommands];
        const customCmds = (await this._customCommands.getCommands()).keys();

        for (const command of commands) {
            const commandName = path.basename(command, '.js').toLowerCase();
            const filePath = pathToFileURL(command);
            const commandObject = (await import(filePath)).default;

            if (!commandObject) {
                console.warn(`Command ${commandName} is empty`);
                continue;
            
            }
            
            const { 
                aliases = [], 
                type = commandTypes.Legacy, 
                devCmd, 
                description, 
                options = [],
                delete: del,
                init = () => {},
            } = commandObject;

            const isLegacy = type === commandTypes.Legacy || type === commandTypes.Both
            const isSlash = type === commandTypes.Slash || type === commandTypes.Both

            if (del) {
                if (isSlash) {
                    for (const server of handler.devServers) {
                        this.slashCommands.deleteCommand(commandName, server);
                    }
                } else {
                    this.slashCommands.deleteCommand(commandName);
                }
                continue;
            }

            await init(handler.client, handler)

            registeredCommands.push(commandName);
            this._commands.set(commandName, commandObject);
            
            if (isLegacy) {
                for (const alias of aliases) {
                    this._commands.set(alias, commandObject);
                }
            }

            if (isSlash) {
                if (devCmd) {
                    for (const devServer of handler.devServers) {
                        this.slashCommands.createCommand(commandName, description, options, devServer);
                    }
                } else {
                    this.slashCommands.createCommand(commandName, description, options);
                }
            }
        }

        for (const cmd of customCmds) {
            const parts = cmd.split('-');
            registeredCommands.push(parts[1]);
        }

        this.deleteRemovedCommands(registeredCommands, handler);
    }

    async deleteRemovedCommands(registeredCommands, handler) {
        const { cache: globalCommands } = await this.slashCommands.getCommands();
        const missingGlobalCommands = globalCommands.map(({ name }) => name)
        .filter((name) => !registeredCommands.includes(name));
        for (const name of missingGlobalCommands) {
            await this.slashCommands.deleteCommand(name);
        }

        for (const server of handler.devServers) {
            const { cache: guildCommands } = await this.slashCommands.getCommands(server);
            const missingGuildCommands = guildCommands.map(({ name }) => name)
            .filter((name) => !registeredCommands.includes(name));
            for (const name of missingGuildCommands) {
                await this.slashCommands.deleteCommand(name, server);
            }
        }
    }
}