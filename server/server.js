import logger from '../command-handler/src/util/logger.js';
import express from 'express';

const log = logger();
const app = express();
const port = process.env.PORT || 5000;

app.get('/', (req, res) => {
    res.sendStatus(200);
})

app.listen(port, () => {
    log.info(`The server is listening on port ${port}`)
})
