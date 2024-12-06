import runCommand from "../../cmd-handler/run-command.js";

export default ({ eventArgs, handler }) => {
    const [message] = eventArgs;
    const { commandHandler } = handler;
    const { content, author, guild, member } = message;
    const prefix = commandHandler.getPrefix(guild?.id);

    if (author.bot || !content.startsWith(prefix)) return;

    const args = content.slice(prefix.length).split(/ +/g);
    const commandName = args.shift().toLowerCase();

    runCommand({
        commandName,
        handler,
        message,
        guild,
        member,
        user: author,
        args,
    })
}