import axios from 'axios'
import type {
  Order,
  Payment,
  PaymentMethod,
  PaymentMethodListRequest,
  VismaStatus,
} from './types'
import type { ParsedQs } from 'qs'
import {
  CheckVismaReturnUrlFailure,
  CreatePaymentFromOrderFailure,
  GetPaymentForOrderFailure,
  GetPaymentMethodListFailure,
  GetPaymentStatusFailure,
  GetPaymentUrlFailure,
  PaymentMethodsNotFound,
  PaymentMethodValidationError,
  PaymentNotFound,
  RejectCreatePaymentError,
} from './errors'

const PAYMENT_METHOD_MAP = new Map()
  .set('invoice', 'billing')
  .set('visma-pay', 'online')
  .set('nordea', 'online')
  .set('osuuspankki', 'online')
  .set('creditcards', 'online')

export const createPaymentFromOrder = async (parameters: {
  order: Order
  paymentMethod: string
  paymentMethodLabel?: string
  language: string
}): Promise<Payment> => {
  const { order, paymentMethod, paymentMethodLabel, language } = parameters
  if (!process.env.PAYMENT_BACKEND_URL) {
    throw new Error('No payment API backend URL set')
  }

  // TODO: move validation outside, change PAYMENT_METHOD_MAP to be an object, use keyof typeof PAYMENT_METHOD_MAP in function signature
  if (!PAYMENT_METHOD_MAP.has(paymentMethod)) {
    throw new PaymentMethodValidationError()
  }
  const paymentMethodPart = PAYMENT_METHOD_MAP.get(paymentMethod)

  const url = `${process.env.PAYMENT_BACKEND_URL}/payment/${paymentMethodPart}/createFromOrder`

  try {
    const result = await axios.post<Payment>(url, {
      paymentMethod,
      paymentMethodLabel: paymentMethodLabel || paymentMethod,
      language,
      order: { order, items: order.items },
    })

    return result.data
  } catch (e) {
    if (e.response?.status === 403) {
      throw new RejectCreatePaymentError('Order status must be confirmed')
    }
    throw new CreatePaymentFromOrderFailure(e)
  }
}

export const getPaymentMethodList = async (parameters: {
  request: PaymentMethodListRequest
}): Promise<PaymentMethod[]> => {
  const { request } = parameters
  if (!process.env.PAYMENT_BACKEND_URL) {
    throw new Error('No payment API backend URL set')
  }

  const url = `${process.env.PAYMENT_BACKEND_URL}/payment/online/get-available-methods`

  try {
    // We use POST instead of GET since we need to send complex parameters,
    // although using GET would be semantically more correct.
    const result = await axios.post<PaymentMethod[]>(url, request)
    return result.data
  } catch (e) {
    if (e.response?.status === 404) {
      throw new PaymentMethodsNotFound()
    }
    throw new GetPaymentMethodListFailure(e)
  }
}

export const checkVismaReturnUrl = async (p: {
  params: ParsedQs
}): Promise<VismaStatus> => {
  const { params } = p
  if (!process.env.PAYMENT_BACKEND_URL) {
    throw new Error('No payment API backend URL set')
  }

  const url = `${process.env.PAYMENT_BACKEND_URL}/payment/online/check-return-url`

  try {
    const result = await axios.get<VismaStatus>(url, {
      params,
    })
    return result.data
  } catch (e) {
    throw new CheckVismaReturnUrlFailure(e)
  }
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

  try {
    const result = await axios.get<string>(url, {
      params: { namespace, orderId },
    })
    return result.data
  } catch (e) {
    throw new GetPaymentUrlFailure(e)
  }
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

  try {
    const result = await axios.get<string>(url, {
      params: { namespace, orderId },
    })
    return result.data
  } catch (e) {
    throw new GetPaymentStatusFailure(e)
  }
}

export const getPaymentForOrder = async (p: {
  orderId: string
  namespace: string
}): Promise<Payment> => {
  const { orderId, namespace } = p
  if (!process.env.PAYMENT_BACKEND_URL) {
    throw new Error('No payment API backend URL set')
  }

  const url = `${process.env.PAYMENT_BACKEND_URL}/payment/online/get`

  try {
    const result = await axios.get<Payment>(url, {
      params: { orderId, namespace },
    })
    return result.data
  } catch (e) {
    if (e.response?.status === 404) {
      throw new PaymentNotFound()
    }
    throw new GetPaymentForOrderFailure(e)
  }
}

export const getPaymentAndValidateUserForOrder = async (p: {
  orderId: string
  namespace: string
  user: string
}): Promise<Payment> => {
  const { orderId, namespace, user } = p
  if (!process.env.PAYMENT_BACKEND_URL) {
    throw new Error('No payment API backend URL set')
  }

  const url = `${process.env.PAYMENT_BACKEND_URL}/payment/online/get-and-validate-user`

  try {
    const result = await axios.get<Payment>(url, {
      params: { orderId, namespace, user },
    })
    return result.data
  } catch (e) {
    if (e.response?.status === 404) {
      throw new PaymentNotFound()
    }
    throw new GetPaymentForOrderFailure(e)
  }
}
