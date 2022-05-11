import type { Logger } from 'winston'

export enum StatusCode {
  BadRequest = 400,
  Unauthorized = 401,
  Forbidden = 403,
  NotFound = 404,
  InternalServerError = 500,
}

type LogLevel = 'none' | 'debug' | 'info' | 'error'

export class ExperienceError extends Error {
  constructor(
    public readonly definition: {
      code: string
      message: string
      responseStatus: StatusCode
      logLevel: LogLevel
    }
  ) {
    super(definition.code)
    // Every extending error must explicitly set the prototype to correctly implement error handling through instanceof operator
    // https://github.com/Microsoft/TypeScript-wiki/blob/main/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, ExperienceError.prototype)
  }

  protected toLoggerMessage() {
    return this
  }

  public log(logger: Logger) {
    const { logLevel } = this.definition
    if (logLevel === 'none') {
      return
    }
    logger.log({
      level: logLevel,
      message: this.toLoggerMessage() as any,
    })
  }

  // public warn(logger: Logger) {
  //   logger.log({
  //     level: 'warn',
  //     message: this.toLoggerMessage() as any,
  //   })
  // }

  public toResponseOutput() {
    return {
      code: this.definition.code,
      message: this.definition.message,
    }
  }
}

export class ExperienceFailure extends ExperienceError {
  public readonly source: Error
  constructor(input: { code: string; message: string; source: Error }) {
    const { source, ...definition } = input
    super({
      ...definition,
      responseStatus: StatusCode.InternalServerError,
      logLevel: 'error',
    })
    Object.setPrototypeOf(this, ExperienceFailure.prototype)
    this.source = source
  }
}
