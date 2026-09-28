/*
    This file is an example of scheduling a task every day at midnight
*/

// import cron from 'node-cron';
// import task from '../tasks/task.js';
import logger from 'command-handler/src/util/logger.js';

const log = logger();

export default (client, handler) => {
//     cron.schedule('0 0 * * *', async () => {
//         log.info('Schedule firing');
//         task({ client, handler });
//     }, {
//         scheduled: true,
//         timezone: "America/Denver"
//     });
}
