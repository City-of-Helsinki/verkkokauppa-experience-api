import axios from 'axios'
import type {Order} from "./types"

const PAYMENT_METHOD_MAP = new Map()
    .set('invoice', 'billing')
    .set('visma-pay', 'online')

export const getPaymentRequestData = async (parameters: {order: Order, paymentMethod: string}): Promise<string> => {
  const {order, paymentMethod}  = parameters
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

  // We use POST instead of GET since we need to send complex parameters,
  // although using GET would be semantically more correct.
  const result = await axios.post<string>(
    url, order
  )

  return result.data
}
