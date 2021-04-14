import { createLogger, format, transports } from 'winston';

const logger = createLogger({
  format: format.combine(format.timestamp(), format.errors({ stack: true }), format.metadata(), format.json()),
  transports: [
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    }),
  ],
  defaultMeta: { service: process.env.SERVICE_NAME },
  level: 'silly',
});

export default logger;
