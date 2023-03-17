import axios from 'axios'
import type {
  Order,
  Payment,
  PaymentFilter,
  PaymentMethod,
  PaytrailStatus,
  VismaPayResponse,
  VismaStatus,
  PaytrailCardFormParameters,
} from './types'
import type { ParsedQs } from 'qs'
import {
  CheckPaytrailRefundCallbackUrlFailure,
  CheckPaytrailReturnUrlFailure,
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
import { ExperienceFailure, removeItem } from '@verkkokauppa/core'
import { PaymentGateway, PaymentStatus, ReferenceType } from './enums'

const allowedPaymentGateways = [
  PaymentGateway.PAYTRAIL.toString(),
  PaymentGateway.VISMA.toString(),
  PaymentGateway.INVOICE.toString(),
]

const checkBackendUrlExists = () => {
  if (!process.env.PAYMENT_BACKEND_URL) {
    throw new Error('No payment API backend URL set')
  }
}

const getBackendUrl = () => {
  const url = process.env.PAYMENT_BACKEND_URL
  if (!url) {
    throw new Error('No payment API backend URL set')
  }
  return url
}

export const createMethodPartFromGateway = (gateway: string) => {
  let paymentMethodPart = ''

  switch (gateway) {
    case 'online-paytrail':
      paymentMethodPart = 'paytrail'
      break
    case 'online':
      paymentMethodPart = 'online'
      break
    case 'offline':
      paymentMethodPart = 'invoice'
      break
  }
  return paymentMethodPart
}

export const createPaymentFromOrder = async (parameters: {
  order: Order
  paymentMethod: string
  gateway: string
  paymentMethodLabel?: string
  language: string
  merchantId: string | null
}): Promise<Payment> => {
  const {
    order,
    paymentMethod,
    paymentMethodLabel,
    language,
    gateway,
    merchantId,
  } = parameters
  if (!process.env.PAYMENT_BACKEND_URL) {
    throw new Error('No payment API backend URL set')
  }

  if (!allowedPaymentGateways.includes(gateway)) {
    throw new PaymentValidationError(
      'payment-method-validation-failed',
      'paymentMethod must be one of allowed payment gateways'
    )
  }
  const paymentMethodPart = createMethodPartFromGateway(gateway)

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
    merchantId,
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
  merchantId: string | null
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

export const filterPaymentMethodByGateway = (
  filteredPaymentFilters: any[],
  globallyFilteredPaymentGateways: string[]
) =>
  filteredPaymentFilters.filter((method) => {
    return !globallyFilteredPaymentGateways.includes(
      method.gateway.toLowerCase()
    )
  })

export const filterPaymentMethodsByCode = (
  filteredPaymentFilters: any[],
  globallyFilteredPaymentMethods: string[]
) =>
  filteredPaymentFilters.filter((method) => {
    return !globallyFilteredPaymentMethods.includes(method.code.toLowerCase())
  })

export const getPaymentMethodList = async (parameters: {
  namespace: string
  totalPrice: number
  currency?: string
  order: Order
  merchantId: string | null
}): Promise<PaymentMethod[]> => {
  const { merchantId, order } = parameters
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
  let filteredPaymentFilters = onlineMethods
    .concat(offlineMethods)
    .filter((method) => {
      return !paymentFilters.find((filter) => {
        const value = filter.value.toLowerCase()
        return (
          value === method.name.toLowerCase() ||
          value === method.code.toLowerCase() ||
          value === method.group.toLowerCase() ||
          value === method.gateway.toLocaleLowerCase()
        )
      })
    })
    .filter((method) => {
      return (
        order.type !== 'subscription' ||
        method.group.toLowerCase().startsWith('creditcard')
      )
    })

  const methods = process.env.FILTERED_PAYMENT_METHODS || 'nordeab2b'
  const globallyFilteredPaymentMethods = methods.split(',')
  // TODO remove Paytrail filter when we are disabling payments via visma pay
  const gateways =
    process.env.FILTERED_PAYMENT_GATEWAYS ||
    `${PaymentGateway.VISMA},${PaymentGateway.INVOICE}`

  let globallyFilteredPaymentGateways = gateways.split(',')

  const paytrailActivatedProductIds =
    process.env.PAYTRAIL_ACTIVATED_PRODUCT_IDS ||
    '5670e008-5357-3c63-a9c2-f85e624fd7b8'

  const globallyActivatedProductIds = paytrailActivatedProductIds.split(',')

  order.items.map((item) => {
    if (globallyActivatedProductIds.includes(item.productId)) {
      globallyFilteredPaymentGateways = removeItem(
        globallyFilteredPaymentGateways,
        PaymentGateway.PAYTRAIL
      )
    }
  })

  filteredPaymentFilters = filterPaymentMethodByGateway(
    filteredPaymentFilters,
    globallyFilteredPaymentGateways
  )

  filteredPaymentFilters = filterPaymentMethodsByCode(
    filteredPaymentFilters,
    globallyFilteredPaymentMethods
  )

  return filteredPaymentFilters
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

export const checkPaytrailReturnUrl = async (p: {
  params: ParsedQs
  merchantId: string
}): Promise<PaytrailStatus> => {
  const { params, merchantId } = p
  if (!process.env.PAYMENT_BACKEND_URL) {
    throw new Error('No payment API backend URL set')
  }

  const url = `${process.env.PAYMENT_BACKEND_URL}/payment/paytrail/check-return-url`

  try {
    const result = await axios.get<PaytrailStatus>(url, {
      params: {
        ...params,
        merchantId,
      },
    })
    return result.data
  } catch (e) {
    throw new CheckPaytrailReturnUrlFailure(e)
  }
}

export const checkPaytrailCardReturnUrl = async (p: {
  params: ParsedQs
  order: Order
}): Promise<Payment> => {
  const { params, order } = p
  const url = `${getBackendUrl()}/payment/paytrail/check-card-return-url`
  try {
    const res = await axios.get(url, {
      params: {
        ...params,
        orderId: order.orderId,
      },
    })
    return res.data
  } catch (e) {
    throw new ExperienceFailure({
      code: 'failed-to-check-paytrail-card-return-url',
      message: 'Failed to check paytrail card return url',
      source: e,
    })
  }
}

export const checkPaytrailRefundCallbackUrl = async (p: {
  params: ParsedQs
  merchantId: string
}): Promise<PaytrailStatus> => {
  const { params, merchantId } = p
  if (!process.env.PAYMENT_BACKEND_URL) {
    throw new Error('No payment API backend URL set')
  }

  const url = `${process.env.PAYMENT_BACKEND_URL}/refund/paytrail/check-refund-callback-url`

  try {
    const result = await axios.get<PaytrailStatus>(url, {
      params: {
        ...params,
        merchantId,
      },
    })
    return result.data
  } catch (e) {
    throw new CheckPaytrailRefundCallbackUrlFailure(e)
  }
}

export const getPaymentUrl = async (p: {
  namespace: string
  orderId: string
  user: string
  gateway: string
}): Promise<string> => {
  const { namespace, orderId, user: userId, gateway } = p
  if (!process.env.PAYMENT_BACKEND_URL) {
    throw new Error('No payment API backend URL set')
  }

  let paymentMethodPart = createMethodPartFromGateway(gateway)
  const url = `${process.env.PAYMENT_BACKEND_URL}/payment/${paymentMethodPart}/url`
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

export const getPaidPaymentAdmin = async (p: {
  orderId: string
}): Promise<Payment | null> => {
  try {
    const payment = await getPaymentForOrderAdmin(p)
    if (payment.status !== PaymentStatus.PAID_ONLINE.toString()) {
      return null
    }
    return payment
  } catch (e) {
    if (e instanceof PaymentNotFound) {
      return null
    }
    throw e
  }
}

export const createPaymentFromUnpaidOrder = async (p: {
  order: Order
  paymentMethod: string
  gateway: string
  paymentMethodLabel?: string
  language: string
  merchantId: string | null
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
    const res = await axios.post<PaymentFilter[]>(url, paymentFilter)
    return res.data
  } catch (e) {
    throw new ExperienceFailure({
      code: 'failed-to-save-payment-filter',
      message: 'failed to save payment filter(s)',
      source: e as Error,
    })
  }
}

export const getPaytrailPaymenCardFormParams = async (p: {
  namespace: string
  merchantId: string
  orderId: string
}): Promise<PaytrailCardFormParameters> => {
  checkBackendUrlExists()

  const { namespace, merchantId, orderId } = p
  const url = `${process.env.PAYMENT_BACKEND_URL}/subscription/get/card-form-parameters`
  try {
    const res = await axios.get<PaytrailCardFormParameters>(url, {
      params: { namespace, merchantId, orderId },
    })
    return res.data
  } catch (e) {
    throw new ExperienceFailure({
      code: 'failed-to-get-card-form-parameters',
      message: 'failed to get card form parameters',
      source: e as Error,
    })
  }
}
