const path = require('path');
const { app } = require('electron');

const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf } = format;
const myFormat = printf((info) => {
  return `[${new Date(info.timestamp).toLocaleString()}]: ${info.level} ${info.message}`;
});

let logRoot;
try {
  logRoot = app.getPath('logs');
} catch (_) {
  logRoot = app.getPath('userData', 'logs');
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

console.log('Log file path is', logPath);
module.exports = logger;
