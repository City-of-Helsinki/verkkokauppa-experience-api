export type InitializedTestNamespace = {
  namespace: string
  merchant: {
    merchantId: string
    namespace: string
    createdAt: string
    updatedAt: string
    configurations: Array<{
      key: string
      value: string
      restricted: boolean
    }>
  }
  createdNamespace: {
    namespaceId: string
    namespace: string
    createdAt: string
    configurations: Array<{
      key: string
      value: string
      restricted: boolean
    }>
  }
  internalProduct: {
    id: string
    name: string
    mapping: any
    original: any
  }
  internalPrice: {
    id: string
    productId: string
    price: string
    grossValue: string
    netValue: string
    vatValue: string
    original: any
    vatPercentage: string
  }
  createdPrice: {
    id: string
    productId: string
    price: string
    grossValue: string
    netValue: string
    vatValue: string
    original: {
      grossValue: string
      netValue: string
      vatValue: string
    }
    vatPercentage: string
  }
  productAccounting: {
    productId: string
    companyCode: string
    mainLedgerAccount: string
    vatCode: string
    internalOrder: any
    profitCenter: any
    balanceProfitCenter: string
    project: string
    operationArea: any
    activeFrom: string
    nextEntity: {
      companyCode: any
      mainLedgerAccount: string
      vatCode: string
      internalOrder: any
      profitCenter: any
      balanceProfitCenter: any
      project: string
      operationArea: string
    }
  }
  kassaUrl: string
}

// Define types based on your schemas
export interface TestOrderItem {
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
  merchantId: string
  invoicingDate?: Date
}

export interface TestCustomer {
  firstName: string
  lastName: string
  email: string
  phone?: string
}

export interface TestPaymentFilter {
  namespace: string
  filterType: string
  value: string
}

export interface CreateTestOrder {
  namespace: string
  user: string
  items?: TestOrderItem[]
  customer?: TestCustomer
  paymentFilters?: TestPaymentFilter[]
  lastValidPurchaseDateTime?: Date
}

export type CreatedTestOrder = {
  orderId: string
  namespace: string
  user: string
  createdAt: string
  items: Array<{
    orderItemId: string
    merchantId: string
    orderId: string
    productId: string
    productName: string
    productLabel: string
    productDescription: string
    quantity: number
    unit: string
    rowPriceNet: string
    rowPriceVat: string
    rowPriceTotal: string
    periodUnit: string
    periodFrequency: number
    priceNet: string
    priceGross: string
    priceVat: string
    vatPercentage: string
    invoicingDate: string
    meta: Array<{
      orderItemMetaId: string
      orderItemId: string
      orderId: string
      key: string
      value: string
      label: string
      visibleInCheckout: string
      ordinal: string
    }>
  }>
  priceNet: string
  priceVat: string
  priceTotal: string
  checkoutUrl: string
  receiptUrl: string
  loggedInCheckoutUrl: string
  updateCardUrl: string
  isValidForCheckout: boolean
  customer: {
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  invoice: {
    invoiceId: string
    businessId: string
    name: string
    address: string
    postcode: string
    city: string
    ovtId: string
  }
  status: string
  subscriptionId: string
  type: string
  paymentMethod: {
    name: string
    code: string
    group: string
    img: string
    gateway: string
  }

  paymentFilters: Array<{
    filterId: string
    createdAt: string
    namespace: string
    referenceId: string
    referenceType: string
    filterType: string
    value: string
  }>
}

export interface TestPaymentMethod {
  name: string
  code: string
  group: string
  img: string
  gateway: string
}

export interface TestPaymentMethodResponse {
  orderId: string
  userId: string
  name: string
  code: string
  group: string
  img: string
  gateway: string
}

export interface TestSelectPaymentMethodParams {
  orderId: string
  paymentMethod: TestPaymentMethod
}

export interface TestConfirmPaymentParams {
  orderId: string
  paymentMethod: string
  language: string
  gateway: string
}
