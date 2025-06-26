/*
This task is responsible for purging a channel of
messages that are older than the current date and not pinned.
*/

import logger from 'command-handler/src/util/logger.js';
import 'dotenv/config';
const log = logger();

export default async ({ client, handler, channel }) => {
    let lastMessageId = null;
    // Initialize an array to store messages to delete.
    let messagesToDelete = [];
    let promotionChannel = null;
    const currentDate = new Date();
    currentDate.setUTCHours(0, 0, 0, 0); // Set time to 00:00:00.000 UTC
    // Try to fetch the promotion channel
    try {
        promotionChannel = await client.channels.fetch(channel);
    } catch (error) {
        log.error('Error fetching promtionChannel', error);
    }

    // Fetch old messages to delete
    while (true) {
        const options = { limit: 100 };
        if (lastMessageId) {
            options.before = lastMessageId;
        }

        const fetchedMessages = await promotionChannel.messages.fetch(options);

        if (fetchedMessages.size === 0) break;

        fetchedMessages.forEach(msg => {
            const messageDate = new Date(msg.createdTimestamp);
            if (!msg.pinned && messageDate < currentDate) {
                messagesToDelete.push(msg);
            }
        });

        lastMessageId = fetchedMessages.last().id;

        if (fetchedMessages.size < 100) break;
    }

    // Delete messages
    for (const msg of messagesToDelete) {
        try {
            await msg.delete();
        } catch (error) {
            console.error(`Could not delete message with ID: ${msg.id}`, error);
        }
    }
}
