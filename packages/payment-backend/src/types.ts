export interface OrderItemRequest {
  productId: string
  productName: string
  quantity: number
  unit: string
  rowPriceNet: string
  rowPriceVat: string
  rowPriceTotal: string
  priceNet: string
  priceGross: string
  priceVat: string
  vatPercentage: string
}

export type OrderItem = OrderItemRequest & {
  orderItemId: string
  orderId: string
}

export interface OrderCustomer {
  firstName: string
  lastName: string
  email: string
}

export interface Order {
  orderId: string
  namespace: string
  user: string
  createdAt: string
  items: OrderItem[]
  checkoutUrl?: string
  customer?: OrderCustomer
  status?: string
  priceNet?: string
  priceVat?: string
  priceTotal?: string
}

export interface PaymentMethod {
  name: string
  code: string
  group: string
  img: string
}

// TODO: other fields (TBD)

export type VismaStatus = {
  paymentPaid: boolean
  canRetry: boolean
  valid: boolean
  authorized?: boolean
  paymentType: string
}

export type VismaPayResponse = {
  result: number
}

export interface Payment {
  paymentId: string
  namespace: string
  orderId: string
  status: string
  paymentMethod: string
  paymentType: string
  totalExclTax: number
  total: number
  taxAmount: number
  description: string | null
  additionalInfo: string
  token: string
  timestamp: string
}

export interface PaymentFilter {
  filterId: string
  createdAt: string
  namespace: string
  referenceId: string
  referenceType: string
  type: string
  value: string
}
