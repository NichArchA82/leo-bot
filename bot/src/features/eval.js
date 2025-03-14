/*
    This file is responsible for scheduling the eval task to run every Monday at 11pm.
*/

import cron from 'node-cron';
import evalTask from '../tasks/eval.js';
import logger from 'command-handler/src/util/logger.js';

const log = logger();

export default (client, handler) => {
    // Scheduled every Monday at 11pm
    // 0 23 * * 1
    cron.schedule('0 23 * * 1', async () => {
        log.info('Schedule firing');
        evalTask(client, handler);
    }, {
        scheduled: true,
        timezone: "America/Denver"
    });
}
