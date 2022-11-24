import {
  ExperienceError,
  ExperienceFailure,
  StatusCode,
} from '@verkkokauppa/core'

export class RefundPaymentValidationError extends ExperienceError {
  constructor(code: string, message: string) {
    super({
      code,
      message,
      logLevel: 'info',
      responseStatus: StatusCode.BadRequest,
    })
  }
}

export class CreateRefundPaymentFromRefundFailure extends ExperienceFailure {
  constructor(source: Error) {
    super({
      code: 'failed-to-create-refund-payment-from-refund',
      message: 'Failed to create refund payment from refund',
      source,
    })
  }
}

export class RefundGatewayValidationError extends ExperienceError {
  constructor(code: string, message: string) {
    super({
      code,
      message,
      logLevel: 'info',
      responseStatus: StatusCode.BadRequest,
    })
  }
}
