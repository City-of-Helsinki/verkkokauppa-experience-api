export enum PaymentStatus {
  CREATED = 'payment_created',
  PAID_ONLINE = 'payment_paid_online',
  CANCELLED = 'payment_cancelled',
  AUTHORIZED = 'authorized',
  INVOICE = 'payment_invoice',
}

export enum RefundPaymentStatus {
  CREATED = 'refund_created',
  PAID_ONLINE = 'refund_paid_online',
  CANCELLED = 'refund_cancelled',
}

export enum PaymentType {
  CREDIT_CARDS = 'creditcards',
  CARD_RENEWAL = 'payment_card_renewal',
}

export enum ReferenceType {
  ORDER = 'order',
  MERCHANT = 'merchant',
}

export enum PaymentGateway {
  PAYTRAIL = 'online-paytrail',
  INVOICE = 'offline',
  VISMA = 'online',

  FREE = 'free',
}

export enum RefundGateway {
  PAYTRAIL = 'online-paytrail',
}
