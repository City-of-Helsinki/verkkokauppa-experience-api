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
export type OrderItemMeta = {
  orderItemMetaId: string
  orderItemId: string
  orderId: string
  key: string
  value: string
  label?: string
  visibleInCheckout?: string
  ordinal?: string
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
  meta: OrderItemMeta[]
  priceNet?: string
  priceVat?: string
  priceTotal?: string
  checkoutUrl?: string
  receiptUrl?: string
  loggedInCheckoutUrl?: string
  customer?: OrderCustomer
  status?: string
  subscriptionId?: string
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
  subscriptionId?: string
}

export type OrderWithItemsBackendResponse = {
  order: OrderBackendResponse & {
    priceNet?: string
    priceVat?: string
    priceTotal?: string
  }
  items: OrderItem[]
}

export interface ProductAccounting {
  priceGross: string
  priceNet: string
  companyCode: string
  mainLedgerAccount: string
  vatCode: string
  internalOrder: string
  profitCenter: string
  project?: string | null
  operationArea?: string | null
}

export type OrderAccountingItem = ProductAccounting & {
  orderItemId: string
  orderId: string
}

export interface OrderAccounting {
  orderId: string
  createdAt: string
  items: OrderAccountingItem[]
}

export type OrderAccountingItemRequest = ProductAccounting & {
  productId: string
}

export interface OrderAccountingRequest {
  orderId: string
  dtos: OrderAccountingItemRequest[]
}
