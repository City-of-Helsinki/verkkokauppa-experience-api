import {
  ExperienceError,
  ExperienceFailure,
  StatusCode,
} from '@verkkokauppa/core'

export class OrderValidationError extends ExperienceError {
  constructor(message: string) {
    super({
      code: 'order-validation-failed',
      message,
      logLevel: 'info',
      responseStatus: StatusCode.Forbidden,
    })
  }
}

export class CreateOrderFailure extends ExperienceFailure {
  constructor(source: Error) {
    super({
      code: 'failed-to-create-order',
      message: 'Failed to create order',
      source,
    })
  }
}

export class CreateOrderWithItemsFailure extends ExperienceFailure {
  constructor(source: Error) {
    super({
      code: 'failed-to-create-order-with-items',
      message: 'Failed to create order with items',
      source,
    })
  }
}

export class CancelOrderFailure extends ExperienceFailure {
  constructor(source: Error) {
    super({
      code: 'failed-to-cancel-order',
      message: 'Failed to cancel order',
      source,
    })
  }
}

export class ConfirmOrderFailure extends ExperienceFailure {
  constructor(source: Error) {
    super({
      code: 'failed-to-confirm-order',
      message: 'Failed to confirm order',
      source,
    })
  }
}

export class SetCustomerToOrderFailure extends ExperienceFailure {
  constructor(source: Error) {
    super({
      code: 'failed-to-set-order-customer',
      message: 'Failed to set order customer',
      source,
    })
  }
}

export class AddItemsToOrderFailure extends ExperienceFailure {
  constructor(source: Error) {
    super({
      code: 'failed-to-add-items-to-order',
      message: 'Failed to add items to order',
      source,
    })
  }
}

export class GetOrderFailure extends ExperienceFailure {
  constructor(source: Error) {
    super({
      code: 'failed-to-get-order',
      message: 'Failed to get order',
      source,
    })
  }
}

export class OrderNotFoundError extends ExperienceError {
  constructor() {
    super({
      code: 'order-not-found',
      message: 'Order not found',
      responseStatus: StatusCode.NotFound,
      logLevel: 'info',
    })
  }
}

export class SetOrderTotalsFailure extends ExperienceFailure {
  constructor(source: Error) {
    super({
      code: 'failed-to-set-order-totals',
      message: 'Failed to set order totals',
      source,
    })
  }
}
