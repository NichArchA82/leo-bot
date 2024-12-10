import { InteractionType } from 'discord.js';
import runCommand from '../../cmd-handler/run-command.js';

export default ({ eventArgs, handler }) => {
    const [interaction] = eventArgs;

    if (interaction.type !== InteractionType.ApplicationCommand) return;

    const { commandName, guild, member, user, options } = interaction;
    const args = options.data.map(({ value }) => value);

    runCommand({
        commandName,
        handler,
        interaction,
        guild,
        member,
        user,
        args,
        options,
    })
};