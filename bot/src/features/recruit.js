import cron from 'node-cron';
import recruit from '../tasks/recruit.js';

export default (client, handler) => {
    cron.schedule('0 0 * * *', async () => {
        console.log('Schedule firing');
        recruit(client, handler);
    }, {
        scheduled: true,
        timezone: "America/Denver"
    });
}