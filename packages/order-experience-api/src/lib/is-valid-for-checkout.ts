import type { Order } from '@verkkokauppa/order-backend'
import { ForbiddenError } from '@verkkokauppa/core'
import { checkLastValidPurchaseDateTime } from '@verkkokauppa/order-backend'

export const checkValidityForCheckout = (order: Order) => {
  if (order.status === 'cancelled') {
    throw new ForbiddenError('Order is cancelled')
  }
  checkLastValidPurchaseDateTime(order.lastValidPurchaseDateTime)
}

export const isValidForCheckout = (order: Order) => {
  try {
    checkValidityForCheckout(order)
    return true
  } catch (e) {
    return false
  }
}
