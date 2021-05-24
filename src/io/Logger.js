/* eslint-disable no-param-reassign */
/* eslint-disable no-console */
import { app } from 'electron';
import path from 'path';
import { createLogger, format, transports } from 'winston';

const { combine, timestamp, printf } = format;

const myFormat = printf((info) => `[${new Date(info.timestamp).toLocaleString()}]: ${info.level} ${info.message}`);
let logRoot;
try {
  logRoot = app.getPath('logs');
} catch (_) {
  logRoot = path.join(app.getPath('userData'), 'logs');
}
const logPath = path.join(logRoot, 'log.log');
const errorPath = path.join(logRoot, 'error.log');

const logger = createLogger({
  exitOnError: false,
  level: 'warning',
  transports: [
    new transports.Console({
      level: 'debug'
    }),
    new transports.File({
      filename: logPath,
      // level: 'debug',
      maxsize: 10 * 1024 * 1024
    }),
    new transports.File({
      filename: errorPath,
      level: 'error',
      maxsize: 10 * 1024 * 1024
    })
  ],
  exceptionHandlers: [
    new transports.File({
      filename: path.join(logRoot, 'exceptions.log')
    })
  ],
  format: combine(
    format.colorize(),
    timestamp(),
    myFormat
  )
});

/**
 * 
 * @param {'debug'|'error'|'info'|'silly'|'verbose'|'warn'} level 
 */
function setLevel(level) {
  logger.transports.forEach((transport) => {
    if (transport.level === undefined) {
      return;
    }
    transport.level = level;
  });
}


console.log('Log file path is', logPath);
export { logger, setLevel };
