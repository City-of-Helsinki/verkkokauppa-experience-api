import {
  ExperienceError,
  ExperienceFailure,
  StatusCode,
} from '@verkkokauppa/core'

export class CreateCartFailure extends ExperienceFailure {
  constructor(source: Error) {
    super({
      code: 'failed-to-create-cart',
      message: 'Failed to create cart',
      source,
    })
  }
}

export class CartNotFoundError extends ExperienceError {
  constructor() {
    super({
      code: 'cart-not-found',
      message: 'Cart not found',
      responseStatus: StatusCode.NotFound,
      logLevel: 'info',
    })
  }
}

export class GetCartFailure extends ExperienceFailure {
  constructor(source: Error) {
    super({
      code: 'failed-to-get-cart',
      message: 'Failed to get cart',
      source,
    })
  }
}

export class FindCartFailure extends ExperienceFailure {
  constructor(source: Error) {
    super({
      code: 'failed-to-find-cart',
      message: 'Failed to find cart',
      source,
    })
  }
}

export class AddItemToCartFailure extends ExperienceFailure {
  constructor(source: Error) {
    super({
      code: 'failed-to-add-item-to-cart',
      message: 'Failed to add item to cart',
      source,
    })
  }
}

export class EditItemInCartFailure extends ExperienceFailure {
  constructor(source: Error) {
    super({
      code: 'failed-to-edit-item-in-cart',
      message: 'Failed to edit item in cart',
      source,
    })
  }
}

export class RemoveItemFromCartFailure extends ExperienceFailure {
  constructor(source: Error) {
    super({
      code: 'failed-to-remove-item-from-cart',
      message: 'Failed to remove item from cart',
      source,
    })
  }
}

export class CreateCartWithItemsFailure extends ExperienceFailure {
  constructor(source: Error) {
    super({
      code: 'failed-to-create-cart-with-items',
      message: 'Failed to create cart with items',
      source,
    })
  }
}

export class UpdateCartTotalsFailure extends ExperienceFailure {
  constructor(source: Error) {
    super({
      code: 'failed-to-update-cart-totals',
      message: 'Failed to update cart totals',
      source,
    })
  }
}

export class ClearCartFailure extends ExperienceFailure {
  constructor(source: Error) {
    super({
      code: 'failed-to-clear-cart',
      message: 'Failed to clear cart',
      source,
    })
  }
}
