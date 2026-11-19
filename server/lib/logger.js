'use strict';
var winston = require('winston');
require('winston-daily-rotate-file');

var logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({ format: winston.format.simple() }),
    new winston.transports.DailyRotateFile({
      dirname:       '/var/log/seewhy',
      filename:      'seewhy-%DATE%.log',
      datePattern:   'YYYY-MM-DD',
      maxFiles:      '14d',
      maxSize:       '100m',
      zippedArchive: true,
    }),
  ],
});

module.exports = logger;
