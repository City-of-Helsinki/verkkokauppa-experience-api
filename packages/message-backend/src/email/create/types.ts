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
  vatTable: VatTable
}

export interface SubscriptionPaymentFailedEmailParameters {
  order: Order
  subscription: Subscription
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
  productLabel?: string
  productDescription?: string
  quantity: number
  unit: string
  originalPriceNet?: string
  originalPriceVat?: string
  originalPriceGross?: string
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

export type SubscriptionItemMeta = OrderItemMeta & {
  subscriptionId?: string
}

export interface Order {
  payment?: Payment | null
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

export interface VatTable {
  [index: string]: number
}

export type HbsTemplateFiles =
  | 'orderConfirmation'
  | 'subscriptionContract'
  | 'subscriptionPaymentFailed'

export interface Subscription {
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
  quantity: number
  priceNet: string
  priceVat: string
  priceGross: string
  vatPercentage: string
  orderId: string
  meta?: SubscriptionItemMeta[]
}
