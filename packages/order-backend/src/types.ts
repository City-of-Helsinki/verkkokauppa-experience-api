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
  invoicingDate?: Date
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

export interface OrderInvoiceRequest {
  orderId: string
  userId: string
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
  lastValidPurchaseDateTime?: Date
  flowSteps?: FlowStep
  paymentMethod?: OrderPaymentMethod
  incrementId?: string
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
  invoice?: OrderInvoice
  lastValidPurchaseDateTime?: Date
}

export type OrderWithItemsBackendResponse = {
  order: OrderBackendResponse & {
    priceNet?: string
    priceVat?: string
    priceTotal?: string
  }
  items: OrderItem[]
  flowSteps?: FlowStep
  paymentMethod?: OrderPaymentMethod
}

export interface ProductAccounting {
  priceGross: string
  priceNet: string
  companyCode: string
  mainLedgerAccount: string
  vatCode: string
  internalOrder: string
  profitCenter: string
  balanceProfitCenter: string
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

export interface OrderItemInvoicing {
  createdAt: string
  updatedAt: string
  status: string
  orderItemId: string
  orderId: string
  orderIncrementId: string
  invoicingDate: string
  customerYid: string
  customerOvt: string
  material: string
  orderType: string
  salesOrg: string
  salesOffice: string
  materialDescription: string
  quantity: number
  unit: string
  priceNet: string
}

export interface FlowStepRequest {
  activeStep: number
  totalSteps: number
}

export interface FlowStep {
  flowStepId: string
  orderId: string
  activeStep: number
  totalSteps: number
}

export interface OrderPaymentMethod {
  name: string
  code: string
  group: string
  img: string
  gateway: string
}
