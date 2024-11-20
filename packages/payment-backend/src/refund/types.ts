export type Refund = {
  refundId: string
  orderId: string
  namespace: string
  user: string
  createdAt: string
  status: 'draft' | 'confirmed'
  customerFirstName?: string
  customerLastName?: string
  customerEmail?: string
  customerPhone?: string
  refundReason?: string
}

export type RefundItem = {
  refundItemId: string
  refundId: string
  orderItemId: string
  orderId: string
  merchantId?: string
  productId: string
  productName?: string
  productLabel?: string
  productDescription?: string
  unit: string
  quantity: number
  rowPriceNet: string
  rowPriceVat: string
  rowPriceTotal: string
  vatPercentage: string
  priceNet: string
  priceVat: string
  priceGross: string
  originalPriceNet?: string
  originalPriceVat?: string
  originalPriceGross?: string
}

export type RefundAggregate = {
  refund: Refund
  items: RefundItem[]
}

export interface RefundPayment {
  refundPaymentId: string
  orderId: string
  namespace: string
  userId: string
  status: string
  refundMethod: string
  refundType: string
  totalExclTax: number
  total: number
  taxAmount: number
  refundTransactionId?: string // If payment is created using paytrail gateway
  timestamp: string
  createdAt: string
}
