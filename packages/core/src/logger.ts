import { createLogger, format, transports } from 'winston'
import { inspect } from 'util'

export const logger = createLogger({
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json({
      replacer: (key, value) => {
        if (value instanceof Error) {
          return inspect(value)
        }
        if (typeof value === 'bigint') {
          return value.toString()
        }
        //TODO: Move sanitization of sensitive (user) data elsewhere. Should not be under all log formatting
        if (typeof value === 'string') {
          if (key.match(/firstname|lastname|phone|email/i)) {
            return value && `${value[0]}...`
          }
        }
        return value
      },
    })
  ),
  transports: [new transports.Console()],
  defaultMeta: { service: process.env.SERVICE_NAME },
  level: 'silly',
})
