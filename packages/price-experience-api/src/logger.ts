import {
  createLogger,
  format, transports,
} from 'winston'

const logger = createLogger({
  format: format.combine(
    format.timestamp(),
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple(),
      ),
    }),
  ],
  defaultMeta: { service: process.env.SERVICE_NAME },
  level: process.env.NODE_ENV === 'development' ? 'silly' : 'warn',
})

export default logger
