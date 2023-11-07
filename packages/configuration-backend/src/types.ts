export type MerchantConfigurationKeys = {
  merchantName: string
  merchantStreet: string
  merchantZip: string
  merchantCity: string
  merchantEmail: string
  merchantPhone: string
  merchantShopId: string
  merchantUrl: string
  merchantTermsOfServiceUrl: string
  merchantBusinessId: string
  // Merchant restricted values
  merchantPaymentWebhookUrl: string
}

export type MerchantKeys = {
  merchantName?: string
  merchantStreet?: string
  merchantZip?: string
  merchantCity?: string
  merchantEmail?: string
  merchantUrl?: string
  merchantTermsOfServiceUrl?: string
  merchantBusinessId?: string
  merchantPhone?: string
  merchantShopId?: string
  merchantPaytrailMerchantId?: string
  [key: string]: any // 👈️ variable keys
}

export type PublicServiceConfigurationKeys = {
  TERMS_OF_USE_URL: string
  TERMS_OF_USE_EMBEDDABLE_CONTENT: string
  ORDER_CREATED_REDIRECT_URL: string
  ORDER_SUCCESS_REDIRECT_URL: string
  ORDER_CANCEL_REDIRECT_URL: string
  PAYMENT_API_VERSION: string
  PAYMENT_RETURN_URL: string
  PAYMENT_NOTIFICATION_URL: string
  refundSuccessRedirectUrl: string
} & MerchantConfigurationKeys

export type RestrictedServiceConfigurationKeys = {
  PAYMENT_API_VERSION: string
  PAYMENT_API_KEY: string
  PAYMENT_CURRENCY: string
  PAYMENT_TYPE: string
  PAYMENT_REGISTER_CARD_TOKEN: string
  PAYMENT_RETURN_URL: string
  PAYMENT_NOTIFICATION_URL: string
  PAYMENT_LANGUAGE: string
  PAYMENT_SUBMERCHANT_ID: string
  PAYMENT_CP: string
  // Merchant
  merchantPaymentWebhookUrl: string
}

export interface ServiceConfiguration {
  configurationId: string
  namespace: string
  configurationKey:
    | keyof PublicServiceConfigurationKeys
    | keyof RestrictedServiceConfigurationKeys
  configurationValue: string
  restricted: boolean
}

export interface Namespace {
  namespaceId?: string
  namespace: string
  createdAt?: string
  updatedAt?: string
  configurations: Configuration[]
}

export interface Merchant {
  merchantId?: string
  namespace: string
  createdAt?: string
  updatedAt?: string
  configurations: Configuration[]
}

export interface Configuration {
  key: string
  value: string
  restricted?: boolean
  locale?: Locale
}

export interface Locale {
  fi: string
  sv: string
  en: string
}

export interface OrderItemRequest {
  productId: string
  productName: string
  productLabel?: string
  productDescription?: string
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
  originalPriceNet?: string
  originalPriceVat?: string
  originalPriceGross?: string
}

export type OrderItem = OrderItemRequest & {
  orderItemId: string
  orderId: string
  merchantId?: string
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

export interface OrderInvoice {
  invoiceId: string
  businessId: string
  name: string
  address: string
  postcode: string
  city: string
  ovtId?: string
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
  invoice?: OrderInvoice
  status?: string
  subscriptionId?: string
  type: OrderType
}
