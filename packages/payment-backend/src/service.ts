import axios from 'axios'
import type {
  Order,
  Payment,
  PaymentFilter,
  PaymentMethod,
  VismaPayResponse,
  VismaStatus,
} from './types'
import type { ParsedQs } from 'qs'
import {
  CheckVismaReturnUrlFailure,
  CreatePaymentFromOrderFailure,
  GetPaymentForOrderFailure,
  GetPaymentMethodListFailure,
  GetPaymentsForOrderFailure,
  GetPaymentStatusFailure,
  GetPaymentUrlFailure,
  PaymentMethodsNotFound,
  PaymentNotFound,
  PaymentsNotFound,
  PaymentValidationError,
} from './errors'
import { ExperienceFailure } from '@verkkokauppa/core'
import { ReferenceType } from './enums'

const PAYMENT_METHOD_MAP = new Map()
  .set('invoice', 'billing')
  .set('visma-pay', 'online')
  .set('nordea', 'online')
  .set('handelsbanken', 'online')
  .set('osuuspankki', 'online')
  .set('danskebank', 'online')
  .set('spankki', 'online')
  .set('saastopankki', 'online')
  .set('paikallisosuuspankki', 'online')
  .set('aktia', 'online')
  .set('alandsbanken', 'online')
  .set('omasaastopankki', 'online')
  .set('masterpass', 'online')
  .set('mobilepay', 'online')
  .set('pivo', 'online')
  .set('siirto', 'online')
  .set('fellowfinance', 'online')
  .set('joustoraha', 'online')
  .set('laskuyritykselle', 'online')
  .set('creditcards', 'online')

const checkBackendUrlExists = () => {
  if (!process.env.PAYMENT_BACKEND_URL) {
    throw new Error('No payment API backend URL set')
  }
}

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
    throw new PaymentValidationError(
      'payment-method-validation-failed',
      'paymentMethod must be one of allowed payment methods'
    )
  }
  const paymentMethodPart = PAYMENT_METHOD_MAP.get(paymentMethod)

  const url = `${process.env.PAYMENT_BACKEND_URL}/payment/${paymentMethodPart}/createFromOrder`
  const dto = {
    paymentMethod,
    paymentMethodLabel: paymentMethodLabel || paymentMethod,
    language,
    order: {
      order: {
        ...order,
        customerFirstName: order.customer?.firstName,
        customerLastName: order.customer?.lastName,
        customerEmail: order.customer?.email,
      },
      items: order.items,
    },
  }
  try {
    const result = await axios.post<Payment>(url, dto)

    return result.data
  } catch (e) {
    if (e.response?.status === 403) {
      throw new PaymentValidationError(
        'payment-validation-failed',
        'order status must be confirmed'
      )
    }
    throw new CreatePaymentFromOrderFailure(e)
  }
}

export const getOnlinePaymentMethods = async (parameters: {
  namespace: string
  totalPrice: number
  currency?: string
  order: Order
}): Promise<PaymentMethod[]> => {
  const {
    order: { items, ...orderDto },
    ...params
  } = parameters
  if (!process.env.PAYMENT_BACKEND_URL) {
    throw new Error('No payment API backend URL set')
  }

  const url = `${process.env.PAYMENT_BACKEND_URL}/payment/online/get-available-methods`

  try {
    // We use POST instead of GET since we need to send complex parameters,
    // although using GET would be semantically more correct.
    const result = await axios.post<PaymentMethod[]>(url, {
      ...params,
      orderDto,
    })
    return result.data
  } catch (e) {
    if (e.response?.status === 404) {
      throw new PaymentMethodsNotFound()
    }
    throw new GetPaymentMethodListFailure(e)
  }
}

export const getOfflinePaymentMethods = async (parameters: {
  namespace: string
  totalPrice: number
  currency?: string
  order: Order
}): Promise<PaymentMethod[]> => {
  const {
    order: { items, ...orderDto },
    ...params
  } = parameters
  if (!process.env.PAYMENT_BACKEND_URL) {
    throw new Error('No payment API backend URL set')
  }

  const url = `${process.env.PAYMENT_BACKEND_URL}/payment/offline/get-available-methods`

  try {
    // We use POST instead of GET since we need to send complex parameters,
    // although using GET would be semantically more correct.
    const result = await axios.post<PaymentMethod[]>(url, {
      ...params,
      orderDto,
    })
    return result.data
  } catch (e) {
    if (e.response?.status === 404) {
      throw new PaymentMethodsNotFound()
    }
    throw new GetPaymentMethodListFailure(e)
  }
}

export const getPaymentFiltersAdmin = async (p: {
  referenceId: string
  referenceType: ReferenceType
}): Promise<PaymentFilter[]> => {
  const { referenceId, referenceType } = p
  if (!process.env.PAYMENT_BACKEND_URL) {
    throw new Error('No payment API backend URL set')
  }
  const url = `${process.env.PAYMENT_BACKEND_URL}/payment-admin/get-payment-filters`
  try {
    const res = await axios.get(url, {
      params: { referenceId, referenceType },
    })
    return res.data
  } catch (e) {
    throw new ExperienceFailure({
      code: 'failed-to-get-payment-filter',
      message: 'failed to get payment filters',
      source: e,
    })
  }
}

export const getMerchantPaymentFilters = (p: { merchantId: string }) => {
  const { merchantId } = p
  return getPaymentFiltersAdmin({
    referenceType: ReferenceType.MERCHANT,
    referenceId: merchantId,
  })
}

export const getOrderPaymentFilters = (p: { orderId: string }) => {
  const { orderId } = p
  return getPaymentFiltersAdmin({
    referenceType: ReferenceType.ORDER,
    referenceId: orderId,
  })
}

export const getPaymentMethodList = async (parameters: {
  namespace: string
  totalPrice: number
  currency?: string
  order: Order & { merchantId?: string }
}): Promise<PaymentMethod[]> => {
  const { merchantId } = parameters.order
  const [
    onlineMethods,
    offlineMethods,
    orderPaymentFilters,
    merchantPaymentFilters,
  ] = await Promise.all([
    getOnlinePaymentMethods(parameters),
    getOfflinePaymentMethods(parameters),
    getOrderPaymentFilters(parameters.order),
    merchantId ? getMerchantPaymentFilters({ merchantId }) : [],
  ])
  const paymentFilters = orderPaymentFilters.concat(merchantPaymentFilters)
  return onlineMethods.concat(offlineMethods).filter((method) => {
    return !paymentFilters.find((filter) => {
      const value = filter.value.toLowerCase()
      return (
        value === method.name.toLowerCase() ||
        value === method.code.toLowerCase()
      )
    })
  })
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
  user: string
}): Promise<string> => {
  const { namespace, orderId, user: userId } = p
  if (!process.env.PAYMENT_BACKEND_URL) {
    throw new Error('No payment API backend URL set')
  }

  const url = `${process.env.PAYMENT_BACKEND_URL}/payment/online/url`

  try {
    const result = await axios.get<string>(url, {
      params: { namespace, orderId, userId },
    })
    return result.data
  } catch (e) {
    if (e.response?.status === 404) {
      throw new PaymentNotFound()
    }
    throw new GetPaymentUrlFailure(e)
  }
}

export const getPaymentStatus = async (p: {
  namespace: string
  orderId: string
  user: string
}): Promise<string> => {
  const { namespace, orderId, user: userId } = p
  if (!process.env.PAYMENT_BACKEND_URL) {
    throw new Error('No payment API backend URL set')
  }

  const url = `${process.env.PAYMENT_BACKEND_URL}/payment/online/status`

  try {
    const result = await axios.get<string>(url, {
      params: { namespace, orderId, userId },
    })
    return result.data
  } catch (e) {
    if (e.response?.status === 404) {
      throw new PaymentNotFound()
    }
    throw new GetPaymentStatusFailure(e)
  }
}

export const getPaymentForOrder = async (p: {
  orderId: string
  namespace: string
  user: string
}): Promise<Payment> => {
  const { orderId, namespace, user: userId } = p
  if (!process.env.PAYMENT_BACKEND_URL) {
    throw new Error('No payment API backend URL set')
  }

  const url = `${process.env.PAYMENT_BACKEND_URL}/payment/online/get`

  try {
    const result = await axios.get<Payment>(url, {
      params: { orderId, namespace, userId },
    })
    return result.data
  } catch (e) {
    if (e.response?.status === 404) {
      throw new PaymentNotFound()
    }
    throw new GetPaymentForOrderFailure(e)
  }
}

export const getPaymentForOrderAdmin = async (p: {
  orderId: string
}): Promise<Payment> => {
  const { orderId } = p
  if (!process.env.PAYMENT_BACKEND_URL) {
    throw new Error('No payment API backend URL set')
  }

  const url = `${process.env.PAYMENT_BACKEND_URL}/payment-admin/online/get`
  try {
    const res = await axios.get(url, {
      params: { orderId },
    })
    return res.data
  } catch (e) {
    if (e.response?.status === 404) {
      throw new PaymentNotFound()
    }
    throw new GetPaymentForOrderFailure(e)
  }
}

export const getPaymentsForOrderAdmin = async (
  p: {
    orderId: string
    namespace: string
  },
  paymentStatus: string
): Promise<Payment[]> => {
  const { orderId, namespace } = p
  if (!process.env.PAYMENT_BACKEND_URL) {
    throw new Error('No payment API backend URL set')
  }

  const url = `${process.env.PAYMENT_BACKEND_URL}/payment-admin/online/list`
  try {
    const res = await axios.get<Payment[]>(url, {
      params: { orderId, namespace, paymentStatus },
    })
    return res.data
  } catch (e) {
    if (e.response?.status === 404) {
      throw new PaymentsNotFound()
    }
    throw new GetPaymentsForOrderFailure(e)
  }
}

export const cancelPaymentAdmin = async (
  paymentId: string
): Promise<VismaPayResponse> => {
  checkBackendUrlExists()

  const url = `${process.env.PAYMENT_BACKEND_URL}/payment-admin/online/cancel`
  try {
    const res = await axios.get(url, {
      params: { paymentId },
    })
    return res.data
  } catch (e) {
    if (e.response?.status === 404) {
      throw new PaymentNotFound()
    }
    throw new GetPaymentForOrderFailure(e)
  }
}

export const paidPaymentExists = async (p: {
  orderId: string
  namespace: string
  user: string
}): Promise<boolean> => {
  try {
    const payment = await getPaymentForOrder(p)
    return payment.status === 'payment_paid_online'
  } catch (e) {
    if (e instanceof PaymentNotFound) {
      return false
    }
    throw e
  }
}

export const createPaymentFromUnpaidOrder = async (p: {
  order: Order
  paymentMethod: string
  paymentMethodLabel?: string
  language: string
}): Promise<Payment> => {
  if (await paidPaymentExists(p.order)) {
    throw new PaymentValidationError(
      'payment-already-paid-validation-failed',
      'payment cannot be created from an already paid order'
    )
  }
  return createPaymentFromOrder(p)
}

export const createAuthorizedPaymentAndGetCardUpdateUrl = async (
  order: Order
): Promise<String> => {
  checkBackendUrlExists()

  const url = `${process.env.PAYMENT_BACKEND_URL}/payment-admin/online/create/card-renewal-payment`

  const dto = {
    order: {
      order: {
        ...order,
        customerFirstName: order.customer?.firstName,
        customerLastName: order.customer?.lastName,
        customerEmail: order.customer?.email,
      },
      items: order.items,
    },
  }

  try {
    const result = await axios.post<String>(url, dto)
    return result.data
  } catch (e) {
    throw new ExperienceFailure({
      code: 'failed-to-create-card-renewal-payment',
      message: 'Failed to create card renewal payment',
      source: e as Error,
    })
  }
}

export const savePaymentFiltersAdmin = async (
  paymentFilter: PaymentFilter[]
): Promise<PaymentFilter[]> => {
  checkBackendUrlExists()

  const url = `${process.env.PAYMENT_BACKEND_URL}/payment-admin/online/save-payment-filters`
  try {
    const res = await axios.post<PaymentFilter[]>(url, {
      params: { paymentFilter },
    })
    return res.data
  } catch (e) {
    throw new ExperienceFailure({
      code: 'failed-to-save-payment-filter',
      message: 'failed to save payment filter(s)',
      source: e as Error,
    })
  }
}
