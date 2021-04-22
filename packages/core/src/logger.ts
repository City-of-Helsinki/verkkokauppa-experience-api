import { createLogger, format, transports } from 'winston'

export const logger = createLogger({
  format: format.combine(format.errors({ stack: true }), format.json()),
  transports: [new transports.Console()],
  defaultMeta: { service: process.env.SERVICE_NAME },
  level: 'silly',
})
