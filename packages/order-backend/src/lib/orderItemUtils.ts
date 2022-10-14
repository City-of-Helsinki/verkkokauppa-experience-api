import type { Order } from '@verkkokauppa/order-backend'

export const parseMerchantIdFromFirstOrderItem = (order: Order) => {
  let merchantId = null
  if (
    order !== undefined &&
    Array.isArray(order.items) &&
    order.items[0] !== undefined &&
    order.items[0].merchantId != undefined
  ) {
    merchantId = order?.items[0]?.merchantId || null
  }
  return merchantId
}
