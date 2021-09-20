export interface OrderItemRequest {
  productId: string
  productName: string
  quantity: number
  unit: string
  rowPriceNet: string
  rowPriceVat: string
  rowPriceTotal: string
  startDate?: Date
  periodUnit?: string
  periodFrequency?: number
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
  phone: string
}
export type OrderType = 'subscription' | 'order'

export interface Order {
  orderId: string
  namespace: string
  user: string
  createdAt: string
  items: OrderItem[]
  priceNet?: string
  priceVat?: string
  priceTotal?: string
  checkoutUrl?: string
  customer?: OrderCustomer
  status?: string
  type: OrderType
}

export interface OrderBackendResponse {
  orderId: string
  namespace: string
  user: string
  createdAt: string
  customerFirstName?: string
  customerLastName?: string
  customerEmail?: string
  customerPhone?: string
  status?: string
  type: OrderType
}

export type OrderWithItemsBackendResponse = {
  order: OrderBackendResponse & {
    priceNet?: string
    priceVat?: string
    priceTotal?: string
  }
  items: OrderItem[]
}
