import axios from 'axios'
import type { Order, PaymentMethod, PaymentMethodListRequest } from './types'

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
}): Promise<string> => {
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

  const result = await axios.post<string>(url, {
    paymentMethod,
    language,
    order: { order },
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
