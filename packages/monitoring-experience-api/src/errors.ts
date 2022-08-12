import { ExperienceError, StatusCode } from '@verkkokauppa/core'

export class IpAddressValidationError extends ExperienceError {
  constructor(message: string) {
    super({
      code: 'ip-address-validation-failed',
      message,
      logLevel: 'info',
      responseStatus: StatusCode.Unauthorized,
    })
  }
}
