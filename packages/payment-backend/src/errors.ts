import {
  ExperienceError,
  ExperienceFailure,
  StatusCode,
} from '@verkkokauppa/core'

export class PaymentValidationError extends ExperienceError {
  constructor(code: string, message: string) {
    super({
      code,
      message,
      logLevel: 'info',
      responseStatus: StatusCode.BadRequest,
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

export class CheckPaytrailReturnUrlFailure extends ExperienceFailure {
  constructor(source: Error) {
    super({
      code: 'failed-to-check-paytrail-return-url',
      message: 'Failed to check paytrail return url',
      source,
    })
  }
}

export class CheckPaytrailRefundCallbackUrlFailure extends ExperienceFailure {
  constructor(source: Error) {
    super({
      code: 'failed-to-check-paytrail-refund-callback-url',
      message: 'Failed to check paytrail refund callback url',
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
    Object.setPrototypeOf(this, PaymentNotFound.prototype)
  }
}

export class RefundPaymentNotFound extends ExperienceError {
  constructor() {
    super({
      code: 'refund-payment-not-found',
      message: 'Refund payment not found',
      logLevel: 'info',
      responseStatus: StatusCode.NotFound,
    })
    Object.setPrototypeOf(this, RefundPaymentNotFound.prototype)
  }
}

export class PaymentsNotFound extends ExperienceError {
  constructor() {
    super({
      code: 'payments-not-found',
      message: 'Payments not found',
      logLevel: 'info',
      responseStatus: StatusCode.NotFound,
    })
    Object.setPrototypeOf(this, PaymentsNotFound.prototype)
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
export class GetRefundPaymentForOrderFailure extends ExperienceFailure {
  constructor(source: Error) {
    super({
      code: 'failed-to-get-refund-payment-for-order',
      message: 'Failed to get refund payment for order',
      source,
    })
  }
}

export class GetRefundPaymentForOrderByRefundIdFailure extends ExperienceFailure {
  constructor(source: Error) {
    super({
      code: 'failed-to-get-refund-payment-for-order-by-refund-id',
      message: 'Failed to get refund payment for order by refund id',
      source,
    })
  }
}
export class GetRefundPaymentByRefundPaymentIdFailure extends ExperienceFailure {
  constructor(source: Error) {
    super({
      code: 'failed-to-get-refund-payment-by-refund-payment-id',
      message: 'Failed to get refund payment by refund payment id',
      source,
    })
  }
}

export class CancelPaymentWithPaymentIdFailure extends ExperienceFailure {
  constructor(source: Error) {
    super({
      code: 'failed-to-cancel-payment-for-payment-id',
      message: 'Failed to cancel payment for given payment id',
      source,
    })
  }
}

export class GetPaymentsForOrderFailure extends ExperienceFailure {
  constructor(source: Error) {
    super({
      code: 'failed-to-get-payments-for-order',
      message: 'Failed to get payments for order',
      source,
    })
  }
}
