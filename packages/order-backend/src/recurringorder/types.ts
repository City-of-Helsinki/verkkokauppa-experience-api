export interface RecurringOrder {
  id: string
  status: string
  customerId: string
  merchant: Merchant
  billingAddress: Address
  shippingAddress: Address
  daysPastDue: number // TODO: ok?
  paymentMethod: string
  paymentMethodToken: string
  shippingMethod: string
  startDate: Date // TODO: date format ok x 6?
  nextDate: Date
  endDate: Date
  pauseStartDate: Date // TODO: Not needed?
  pauseEndDate: Date // TODO: Not needed?
  periodUnit: string
  periodFrequency: number
  product: Product
  priceNet: string
  priceVat: string
  priceTotal: string
  quantity: number
  failureCount: number
  currentBillingCycle: number
  numberOfBillingCycles: number
  paidThroughDate: Date
  relatedOrderIds: Set<string>
}

interface Address {
  id: string
  street: string
  city: string
  postalCode: string
  state: string
  country: string
}

interface Merchant {
  name: string
  namespace: string
}

interface Product {
  id: string
  name: string
}

export interface IdWrapper {
  id: string
}

export interface RecurringOrderCriteria {
  activeAtDate: string
  customerId: string
  status: string
  merchantNamespace: string
}
