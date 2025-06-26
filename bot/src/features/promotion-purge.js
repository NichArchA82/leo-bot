/*
    This file is responsible for scheduling the promotion purge task to run every Monday at 11pm.
*/

import cron from 'node-cron';
import channelPurge from '../tasks/channel-purge.js';
import logger from 'command-handler/src/util/logger.js';

const log = logger();

export default (client, handler) => {
    // Scheduled every Monday at 11pm
    // 0 23 * * 1
    cron.schedule('0 23 * * 1', async () => {
        log.info('Schedule firing');
        channelPurge({ client, handler, channel: process.env.PROMOTION_CHANNEL })
            .then(() => {
                log.info('Promotion purge completed successfully.');
            })
            .catch(error => {
                log.error('Error during promotion purge:', error);
            });
    }, {
        scheduled: true,
        timezone: "America/Denver"
    });
}
