import type { OrderItemRequest } from '@verkkokauppa/order-backend'

export const calculateTotalsFromItems = (p: {
  items: OrderItemRequest[]
}): { priceNet: string; priceVat: string; priceTotal: string } => {
  const { items } = p
  let priceNet = 0
  let priceVat = 0
  let priceTotal = 0
  for (const item of items) {
    priceNet += parseFloat(item.rowPriceNet)
    priceVat += parseFloat(item.rowPriceVat)
    priceTotal += parseFloat(item.rowPriceTotal)
  }
  return {
    priceNet: priceNet.toString(),
    priceVat: priceVat.toString(),
    priceTotal: priceTotal.toString(),
  }
}
