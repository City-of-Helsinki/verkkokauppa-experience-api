import { ExperienceError, ExperienceFailure, StatusCode } from './models'

export class RequestValidationError extends ExperienceError {
  constructor(validationErrors: string) {
    super({
      code: 'request-validation-failed',
      message: validationErrors,
      responseStatus: StatusCode.BadRequest,
      logLevel: 'debug',
    })
  }
}

export class ForbiddenError extends ExperienceError {
  constructor(cannotProcessErrors: string) {
    super({
      code: 'forbidden-request',
      message: cannotProcessErrors,
      responseStatus: StatusCode.Forbidden,
      logLevel: 'debug',
    })
  }
}

export class UnexpectedError extends ExperienceFailure {
  constructor(source: Error) {
    super({
      code: 'unexpected',
      message: 'An unexpected error occurred',
      source,
    })
  }
}
