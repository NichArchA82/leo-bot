import getCustomCommandSchema from '../schemas/custom-command-schema.js';
import getRequiredRolesSchema from '../schemas/required-roles-schema.js';

export default class CustomCommands {
    // guildId-commandName: response
    _customCommands = new Map();

    constructor(commandHandler) {
        CustomCommands.count++;
        this._commandHandler = commandHandler
        this._loadPromise = this.loadCommands();
    }

    async loadCommands() {
        const customCommandSchema = getCustomCommandSchema(this._commandHandler);
        const results = await customCommandSchema.find({})

        for (const result of results) {
            const { _id, resp, member, reply } = result
            this._customCommands.set(_id, [resp, member, reply])
        }
    }

    async getCommands() {
        await this._loadPromise;
        return this._customCommands;
    }
    
    async create(guildId, commandName, desc, resp, member, reply) {
        const _id = `${guildId}-${commandName}`

        const customCommandSchema = getCustomCommandSchema(this._commandHandler);
        this._commandHandler.commandHandler.slashCommands.createCommand(commandName, desc, [], guildId)
        await customCommandSchema.findOneAndUpdate({
            _id,
        }, {
            _id,
            desc,
            resp,
            member: member.id,
            reply
        }, {
            upsert: true,
        })
        this._customCommands.set(_id, [resp, member.id, reply]);
    }

    async delete(guildId, commandName) {
        const _id = `${guildId}-${commandName}`;
        const customCommandSchema = getCustomCommandSchema(this._commandHandler);
        this._customCommands.delete(_id);
        this._commandHandler.commandHandler.slashCommands.deleteCommand(commandName, guildId);
        await customCommandSchema.deleteOne({_id});
    }

    async run(commandName, interaction, guild, member) {
        if (!guild) {
            return
        }

        const _id = `${guild.id}-${commandName}`;

        const requiredroles = getRequiredRolesSchema(this._commandHandler);
        const document = await requiredroles.findById(_id);

        const response = await this._customCommands.get(_id);

        if (!response) {
            return
        }

        let hasRole = false;
        if (document) {
            for (const roleId of document.roles) {
                if (member.roles.cache.has(roleId)) {
                    hasRole = true;
                    break;
                }
            }

            if (!document.roles.length) hasRole = false;
        }
        
        if (response[1] != member.id && !hasRole) {
            interaction.reply({
                content: `Insufficient Permission. Must be the custom command owner ${member} OR have one of the following roles: ${document?.roles?.length > 0 ? document.roles.map((roleId) => `<@&${roleId}>`).join(', ') : 'none'}`,
                allowedMentions: {
                    roles: [],
                    members: [],
                },
                ephemeral: true
            });
            return;
        }

        if (response[2] === true) {
            if (interaction) interaction.reply(response[0]).catch(() => {})
        } else if (response[2] === false) {
            if (interaction) {
                interaction.reply({ content: 'Message sent', ephemeral: true }).then(() => {
                    interaction.deleteReply();
                });
                interaction.channel.send(response[0]).catch(() => {});
            }
        }
    }
}