import axios from 'axios'
import type {
  Order,
  Payment,
  PaymentMethod,
  PaymentMethodListRequest,
  VismaStatus,
} from './types'
import type { ParsedQs } from 'qs'

const PAYMENT_METHOD_MAP = new Map()
  .set('invoice', 'billing')
  .set('visma-pay', 'online')
  .set('nordea', 'online')
  .set('osuuspankki', 'online')
  .set('creditcards', 'online')

export const createPaymentFromOrder = async (parameters: {
  order: Order
  paymentMethod: string
  language: string
}): Promise<Payment> => {
  const { order, paymentMethod, language } = parameters
  if (!process.env.PAYMENT_BACKEND_URL) {
    throw new Error('No payment API backend URL set')
  }

  let paymentMethodPart = null
  if (PAYMENT_METHOD_MAP.has(paymentMethod)) {
    paymentMethodPart = PAYMENT_METHOD_MAP.get(paymentMethod)
  } else {
    throw new Error('Unsupported payment method given as parameter')
  }

  const url = `${process.env.PAYMENT_BACKEND_URL}/payment/${paymentMethodPart}/createFromOrder`

  const result = await axios.post<Payment>(url, {
    paymentMethod,
    language,
    order: { order, items: order.items },
  })

  return result.data
}

export const getPaymentMethodList = async (parameters: {
  request: PaymentMethodListRequest
}): Promise<PaymentMethod[]> => {
  const { request } = parameters
  if (!process.env.PAYMENT_BACKEND_URL) {
    throw new Error('No payment API backend URL set')
  }

  const url = `${process.env.PAYMENT_BACKEND_URL}/payment/online/get-available-methods`

  // We use POST instead of GET since we need to send complex parameters,
  // although using GET would be semantically more correct.
  const result = await axios.post<PaymentMethod[]>(url, request)
  return result.data
}

export const checkVismaReturnUrl = async (p: {
  params: ParsedQs
}): Promise<VismaStatus> => {
  const { params } = p
  if (!process.env.PAYMENT_BACKEND_URL) {
    throw new Error('No payment API backend URL set')
  }

  const url = `${process.env.PAYMENT_BACKEND_URL}/payment/online/check-return-url`

  const result = await axios.get<VismaStatus>(url, {
    params,
  })
  return result.data
}

export const getPaymentUrl = async (p: {
  namespace: string
  orderId: string
}): Promise<string> => {
  const { namespace, orderId } = p
  if (!process.env.PAYMENT_BACKEND_URL) {
    throw new Error('No payment API backend URL set')
  }

  const url = `${process.env.PAYMENT_BACKEND_URL}/payment/online/url`

  const result = await axios.get<string>(url, {
    params: { namespace, orderId },
  })
  return result.data
}

export const getPaymentStatus = async (p: {
  namespace: string
  orderId: string
}): Promise<string> => {
  const { namespace, orderId } = p
  if (!process.env.PAYMENT_BACKEND_URL) {
    throw new Error('No payment API backend URL set')
  }

  const url = `${process.env.PAYMENT_BACKEND_URL}/payment/online/status`

  const result = await axios.get<string>(url, {
    params: { namespace, orderId },
  })
  return result.data
}
