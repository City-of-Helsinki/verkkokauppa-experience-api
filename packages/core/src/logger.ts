import { createLogger, format, transports } from 'winston'
import { inspect } from 'util'

export const logger = createLogger({
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json({
      replacer: (_key, value) => {
        if (value instanceof Error) {
          return inspect(value)
        }
        return value
      },
    })
  ),
  transports: [new transports.Console()],
  defaultMeta: { service: process.env.SERVICE_NAME },
  level: 'silly',
})
