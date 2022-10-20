import { URL } from 'url'
import { getPublicServiceConfiguration } from '@verkkokauppa/configuration-backend'
import type { Order, VismaStatus } from '@verkkokauppa/payment-backend'
import { logger } from '@verkkokauppa/core'
import { PaymentType } from '@verkkokauppa/payment-backend'

export const createUserRedirectUrl = async ({
  order,
  vismaStatus,
}: {
  order: Order
  vismaStatus: VismaStatus
}): Promise<URL> => {
  if (!process.env.REDIRECT_PAYMENT_URL_BASE) {
    throw new Error('No default redirect url specified')
  }
  let internalRedirectUrl = new URL(process.env.REDIRECT_PAYMENT_URL_BASE)

  if (!vismaStatus.valid) {
    internalRedirectUrl.pathname = 'failure'
    return internalRedirectUrl
  }

  const serviceSpecificRedirectUrl = await getServiceSpecificRedirectUrl({
    order,
    vismaStatus,
  })

  internalRedirectUrl = createPaymentRedirectUrlFromVismaStatus(
    vismaStatus,
    order,
    internalRedirectUrl,
    true
  )

  return serviceSpecificRedirectUrl || internalRedirectUrl
}

export const parseOrderIdFromRedirect = (p: { query: any }) => {
  const { query } = p

  const result = query.ORDER_NUMBER?.toString().split('_')
  return result[0]
}

export const createPaymentRedirectUrlFromVismaStatus = (
  vismaStatus: VismaStatus,
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
  if (isPaid(vismaStatus)) {
    redirectUrl.pathname = `${orderId}/success`
  } else if (canRetryPayment(vismaStatus)) {
    redirectUrl.pathname = `${orderId}/summary`
    redirectUrl.searchParams.append('paymentPaid', 'false')
  } else if (isAuthorized(vismaStatus) && isCardRenewal(vismaStatus)) {
    redirectUrl.pathname = `${orderId}/card-update-success`
  } else if (isCardRenewal(vismaStatus)) {
    // If card renewal is not authorized it must be failed, so forward to card-update-failed
    redirectUrl.pathname = `${orderId}/card-update-failed`
  } else {
    redirectUrl.pathname = `${orderId}/failure`
  }
  return redirectUrl
}

const isPaid = (p: VismaStatus) => {
  const { paymentPaid } = p
  return paymentPaid
}

const canRetryPayment = (p: VismaStatus) => {
  const { paymentPaid, canRetry } = p
  return !paymentPaid && canRetry
}

export const isAuthorized = (p: VismaStatus) => {
  const { paymentPaid, authorized } = p
  return !paymentPaid && authorized
}

export const isCardRenewal = (vismaStatus: VismaStatus) => {
  return vismaStatus.paymentType == PaymentType.CARD_RENEWAL.toString()
}

const getServiceSpecificRedirectUrl = async (p: {
  order: Order
  vismaStatus: VismaStatus
}): Promise<URL | undefined> => {
  const { order, vismaStatus } = p
  try {
    const paymentReturnUrlConfiguration = await getPublicServiceConfiguration({
      namespace: order.namespace,
      key: 'ORDER_CREATED_REDIRECT_URL', //TODO: Rename to ORDER_SUCCESS_REDIRECT_URL
    })
    if (
      paymentReturnUrlConfiguration.configurationValue &&
      paymentReturnUrlConfiguration.configurationValue !== '' &&
      !canRetryPayment(vismaStatus)
    ) {
      // Use service redirect url if configuration is set
      let redirectUrl = new URL(
        paymentReturnUrlConfiguration.configurationValue
      )

      redirectUrl.searchParams.append('orderId', order.orderId)

      redirectUrl = createPaymentRedirectUrlFromVismaStatus(
        vismaStatus,
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
