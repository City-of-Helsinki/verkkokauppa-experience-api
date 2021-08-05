import type { OrderItemRequest } from '@verkkokauppa/order-backend'

export const calculateTotalsFromItems = (p: { items: OrderItemRequest[] }) => {
  const { items } = p
  let priceNet = 0
  let priceVat = 0
  let priceTotal = 0
  for (const item of items) {
    priceNet += item.rowPriceNet
    priceVat += item.rowPriceVat
    priceTotal += item.rowPriceTotal
  }
  return { priceNet, priceVat, priceTotal }
}
