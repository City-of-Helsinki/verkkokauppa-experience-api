import {
  ExperienceError,
  ExperienceFailure,
  StatusCode,
} from '@verkkokauppa/core'

export class PaymentMethodValidationError extends ExperienceError {
  constructor() {
    super({
      code: 'payment-method-validation-failed',
      message:
        'paymentMethod must be one of invoice, visma-pay, nordea, osuuspankki, creditcards',
      responseStatus: StatusCode.BadRequest,
      logLevel: 'debug',
    })
  }
}

export class PaymentValidationError extends ExperienceError {
  constructor(message: string) {
    super({
      code: 'payment-validation-failed',
      message,
      logLevel: 'info',
      responseStatus: StatusCode.Forbidden,
    })
  }
}

export class CreatePaymentFromOrderFailure extends ExperienceFailure {
  constructor(source: Error) {
    super({
      code: 'failed-to-create-payment-from-order',
      message: 'Failed to create payment from order',
      source,
    })
  }
}

export class PaymentMethodsNotFound extends ExperienceError {
  constructor() {
    super({
      code: 'payment-methods-not-found',
      message: 'Payment methods not found',
      logLevel: 'info',
      responseStatus: StatusCode.NotFound,
    })
  }
}

export class GetPaymentMethodListFailure extends ExperienceFailure {
  constructor(source: Error) {
    super({
      code: 'failed-to-get-payment-method-list',
      message: 'Failed to get payment method list',
      source,
    })
  }
}

export class CheckVismaReturnUrlFailure extends ExperienceFailure {
  constructor(source: Error) {
    super({
      code: 'failed-to-check-visma-return-url',
      message: 'Failed to check visma return url',
      source,
    })
  }
}

export class GetPaymentUrlFailure extends ExperienceFailure {
  constructor(source: Error) {
    super({
      code: 'failed-to-get-payment-url',
      message: 'Failed to get payment url',
      source,
    })
  }
}

export class GetPaymentStatusFailure extends ExperienceFailure {
  constructor(source: Error) {
    super({
      code: 'failed-to-get-payment-status',
      message: 'Failed to get payment status',
      source,
    })
  }
}

export class PaymentNotFound extends ExperienceError {
  constructor() {
    super({
      code: 'payment-not-found',
      message: 'Payment not found',
      logLevel: 'info',
      responseStatus: StatusCode.NotFound,
    })
  }
}

export class GetPaymentForOrderFailure extends ExperienceFailure {
  constructor(source: Error) {
    super({
      code: 'failed-to-get-payment-for-order',
      message: 'Failed to get payment for order',
      source,
    })
  }
}
