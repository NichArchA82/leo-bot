/*
    This file is responsible for scheduling the recruit task to run every day at midnight.
*/

import cron from 'node-cron';
import recruit from '../tasks/recruit.js';
import logger from 'command-handler/src/util/logger.js';

const log = logger();

export default (client, handler) => {
    cron.schedule('0 0 * * *', async () => {
        log.info('Schedule firing');
        recruit({ client, handler });
    }, {
        scheduled: true,
        timezone: "America/Denver"
    });
}