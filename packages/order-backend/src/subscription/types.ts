export interface Subscription {
  status: string
  namespace: string
  merchantName: string
  customerFirstName: string
  customerLastName: string
  customerEmail: string
  customerPhone: string
  paymentMethod: string
  paymentMethodToken: string
  user: string
  startDate: string
  endDate: string
  billingStartDate: string
  periodUnit: string
  periodFrequency: number
  periodCount: number
  productId: string
  orderItemId: string
  productName: string
  quantity: number
  priceNet: string
  priceVat: string
  priceTotal: string
  orderId?: string
}
