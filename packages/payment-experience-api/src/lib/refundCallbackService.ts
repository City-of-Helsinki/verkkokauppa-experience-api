import type {
  Order,
  PaytrailStatus,
  VismaStatus,
} from '@verkkokauppa/payment-backend'
import { URL } from 'url'
import { isPaid } from './paymentReturnService'
import { getPublicServiceConfiguration } from '@verkkokauppa/configuration-backend'
import { logger } from '@verkkokauppa/core'

export const canRetryRefundPayment = (p: VismaStatus | PaytrailStatus) => {
  const { paymentPaid, canRetry } = p
  return !paymentPaid && canRetry
}

export const createUserRefundRedirectUrl = async ({
  order,
  refundPaymentStatus,
  redirectPaymentUrlBase,
}: {
  order: Order
  refundPaymentStatus: VismaStatus | PaytrailStatus
  redirectPaymentUrlBase: string
}): Promise<URL> => {
  if (!redirectPaymentUrlBase) {
    throw new Error('No default refund redirect url specified')
  }
  let internalRedirectUrl = new URL(redirectPaymentUrlBase)

  if (!refundPaymentStatus.valid) {
    internalRedirectUrl.pathname = 'failure'
    return internalRedirectUrl
  }

  const serviceSpecificRedirectUrl = await getServiceSpecificRefundRedirectUrl({
    order,
    refundPaymentStatus: refundPaymentStatus,
  })

  internalRedirectUrl = createRefundRedirectUrlFromRefundPaymentStatus(
    refundPaymentStatus,
    order,
    internalRedirectUrl,
    true
  )

  return serviceSpecificRedirectUrl || internalRedirectUrl
}

const getServiceSpecificRefundRedirectUrl = async (p: {
  order: Order
  refundPaymentStatus: VismaStatus | PaytrailStatus
}): Promise<URL | undefined> => {
  const { order, refundPaymentStatus } = p
  try {
    const paymentReturnUrlConfiguration = await getPublicServiceConfiguration({
      namespace: order.namespace,
      key: 'REFUND_SUCCESS_REDIRECT_URL',
    })
    if (
      paymentReturnUrlConfiguration.configurationValue &&
      paymentReturnUrlConfiguration.configurationValue !== '' &&
      !canRetryRefundPayment(refundPaymentStatus)
    ) {
      // Use service redirect url if configuration is set
      let redirectUrl = new URL(
        paymentReturnUrlConfiguration.configurationValue
      )

      redirectUrl.searchParams.append('orderId', order.orderId)

      redirectUrl = createRefundRedirectUrlFromRefundPaymentStatus(
        refundPaymentStatus,
        order,
        redirectUrl,
        false
      )

      return redirectUrl
    }
  } catch (e) {
    logger.error(e) // Return undefined if no service specific url can be generated
  }
  return undefined
}

export const createRefundRedirectUrlFromRefundPaymentStatus = (
  refundPaymentStatus: VismaStatus | PaytrailStatus,
  order: Order,
  redirectUrl: URL,
  isInternalUrl: boolean
) => {
  // use empty orderId when using
  let orderId = ''
  // If using internal url we need to append orderId to path
  if (isInternalUrl) {
    orderId = order.orderId
  }
  // No service specific configuration set OR can still retry payment in checkout
  if (isPaid(refundPaymentStatus)) {
    redirectUrl.pathname = `${orderId}/success`
  } else if (canRetryRefundPayment(refundPaymentStatus)) {
    redirectUrl.pathname = `${orderId}/summary`
    redirectUrl.searchParams.append('refundPaid', 'false')
  } else {
    redirectUrl.pathname = `${orderId}/failure`
  }
  return redirectUrl
}
