export interface OrderItemRequest {
  productId: string
  productName: string
  quantity: number
  unit: string
  rowPriceNet: number
  rowPriceVat: number
  rowPriceTotal: number
  startDate?: Date
  periodUnit?: string
  periodFrequency?: number
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
  priceNet?: number
  priceVat?: number
  priceTotal?: number
  checkoutUrl?: string
  customer?: OrderCustomer
  status?: string
}

export interface OrderBackendResponse {
  orderId: string
  namespace: string
  user: string
  createdAt: string
  customerFirstName?: string
  customerLastName?: string
  customerEmail?: string
  status?: string
}

export type OrderWithItemsBackendResponse = {
  order: OrderBackendResponse & {
    priceNet: string
    priceVat: string
    priceTotal: string
  }
  items: OrderItem[]
}
