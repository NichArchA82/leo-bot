export default class SlashCommands {
    constructor(client) {
        this._client = client;
    }

    get client() {
        return this._client;
    }

    async getCommands(guildId) {
        let commands;

        if (guildId) {
            const guild = await this.client.guilds.fetch(guildId);
            commands = guild.commands;
        } else {
            commands = this.client.application.commands;
        }

        await commands.fetch();
        return commands;
    }

    isObjectSame(obj1, obj2) {
        const obj1Keys = Object.keys(obj1);
        const obj2Keys = Object.keys(obj2);

        if (obj1Keys.length !== obj2Keys.length) return false;

        for (let key of obj1Keys) {
            if (obj1[key] !== obj2[key]) return false;
        }

        return true;
    }
    
    areOptionsSame(options1, options2) {
        if (options1.length !== options2.length) return false;

        for (let i = 0; i < options1.length; i++) {
            if (!this.isObjectSame(options1[i], options2[i])) return false;
        }

        return true;
    }
    
    async createCommand(name, description, options = [], guildId) {
        if (!description) throw new Error('Description is required for slash commands');

        const commands = await this.getCommands(guildId);
        
        const existingCommand = commands.cache.find(cmd => cmd.name === name);

        if (existingCommand) {
            const { description: oldDesc, options: oldOpt } = existingCommand;

            const obj1 = JSON.parse(JSON.stringify(options));
            const obj2 = JSON.parse(JSON.stringify(oldOpt));

            if (description !== oldDesc || !this.areOptionsSame(obj1, obj2)) {
                console.log(`Updating Slash Command: ${name}`)
                await commands.edit(existingCommand.id, { description, options });
            }

            return
        }
        try {
            await commands.create({
                name,
                description,
                options
            });
        } catch (error) {}
    }

    async deleteCommand(name, guildId) {
        const commands = await this.getCommands(guildId);
        const existingCommand = commands.cache.find(cmd => cmd.name === name);

        if (!existingCommand) {
            console.warn(`Command ${name} does not exist`);
            return;
        }

        console.log(`Deleting Slash Command: ${name}`)
        await existingCommand.delete();
    }
}