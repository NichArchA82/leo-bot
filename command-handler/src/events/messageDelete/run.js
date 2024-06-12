import getRecruitMessagesSchema from '../../schemas/recruit-messages-schema.js';

export default async (message, handler) => {
    try {
        const recruitMessagesSchema = getRecruitMessagesSchema(handler);
        const document = await recruitMessagesSchema.findOne({ _id: message.guild.id });

        if (!document) return;

        for (const msg of document.evalMessages) {
            if (message.id === msg.messageId) {
                await recruitMessagesSchema.findOneAndUpdate({
                    _id: message.guild.id
                }, {
                    $pull: {
                        evalMessages: {
                            messageId: message.id
                        }
                    }
                })
                break;
            }
        }
    } catch (error) {
        console.error(error);
    }
}