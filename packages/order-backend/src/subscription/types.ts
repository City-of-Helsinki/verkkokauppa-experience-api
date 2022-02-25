export interface Subscription {
  id: string
  subscriptionId: string
  status: string
  namespace: string
  merchantName: string
  customerFirstName: string
  customerLastName: string
  customerEmail: string
  customerPhone: string
  paymentMethod: string
  paymentMethodToken: string
  paymentMethodExpirationYear: string
  paymentMethodExpirationMonth: string
  paymentMethodCardLastFourDigits: string
  user: string
  startDate: string
  endDate: string
  renewalDate: string
  billingStartDate: string
  periodUnit: string
  periodFrequency: number
  periodCount: number
  productId: string
  orderItemId: string
  productName: string
  productLabel?: string
  productDescription?: string
  quantity: number
  priceNet: string
  priceVat: string
  priceGross: string
  vatPercentage: string
  orderId: string
  originalPriceNet: string
  originalPriceVat: string
  originalPriceGross: string
  meta: SubscriptionItemMeta[]
}

export interface SubscriptionItemMeta {
  orderItemMetaId: string
  orderItemId: string
  orderId: string
  subscriptionId: string
  key: string
  value: string
  label: string
  visibleInCheckout: string
  ordinal: string
}

export type SubscriptionsList = {
  [key: string]: Subscription
}
