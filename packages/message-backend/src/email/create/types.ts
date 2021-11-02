export interface EmailTemplateCreatePayload {
  orderId: string
  emailMessageType: 'orderConfirmation'
}

export interface EmailTemplateDto {
  template: string
  error?: string
}

export interface OrderConfirmationEmailParameters {
  order: Order
}

export type OrderCustomer = {
  firstName: string
  lastName: string
  email: string
  phone?: string
} & {
  address?: string
  district?: string
}

export type OrderMerchant = {
  merchantName: string
  merchantStreet: string
  merchantZip: string
  merchantCity: string
  merchantBusinessId?: string
  merchantEmail: string
  merchantPhone: string
  merchantUrl: string
  merchantTermsOfServiceUrl: string
}

export interface OrderItemRequest {
  productId: string
  productName: string
  quantity: number
  unit: string
  rowPriceNet: string
  rowPriceVat: string
  rowPriceTotal: string
  startDate?: Date | string
  periodUnit?: string
  periodFrequency?: number
  priceNet: string
  priceGross: string
  priceVat: string
  vatPercentage: string
}

export type OrderType = 'subscription' | 'order'

export type OrderItem = OrderItemRequest & {
  orderItemId: string
  orderId: string
} & {
  meta?: OrderItemMeta[]
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

export interface Order {
  payment: Payment | null
  orderId: string
  createdAt: string
  items: OrderItem[]
  priceNet?: string
  priceVat?: string
  priceTotal?: string
  customer?: OrderCustomer
  status?: string
  type?: OrderType
  merchant?: OrderMerchant
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
  timestamp?: string
  paymentMethodLabel?: string
  token: string
}

export type HbsTemplateFiles = 'orderConfirmation'
