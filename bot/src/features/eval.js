import cron from 'node-cron';
import evalTask from '../tasks/eval.js';

export default (client, handler) => {
    // Scheduled every Monday at 11pm
    // 0 23 * * 1
    cron.schedule('* * * * *', async () => {
       evalTask(client, handler); 
    }, {
        scheduled: true,
        timezone: "America/Denver"
    });
}
