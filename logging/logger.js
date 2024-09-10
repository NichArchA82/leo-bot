import { createLogger, format, transports } from 'winston';
import path from 'path';
import fs from 'fs';

const { combine, timestamp, json } = format;

// Define the absolute path to the logs directory
const logDirectory = path.resolve('../logging/logs');
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory, { recursive: true });
}

// Cache for loggers
const loggers = {};

export const getLogger = (guildId, eventId) => {
  const loggerKey = `${guildId}-${eventId}`;

  if (!loggers[loggerKey]) {
    const logPath = path.join(logDirectory, `${loggerKey}.log`);
    loggers[loggerKey] = createLogger({
      format: combine(
        timestamp(),
        json()
      ),
      transports: [
        new transports.File({ filename: logPath }),
        new transports.Console()
      ]
    });
  }

  return loggers[loggerKey];
};
