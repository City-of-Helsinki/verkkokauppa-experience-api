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

export interface PaymentMethodListRequest {
  namespace: string
  totalPrice: number
  currency?: string
}

export interface PaymentMethod {
  name: string
  code: number
  group: string
  img: string
}

// TODO: other fields (TBD)
