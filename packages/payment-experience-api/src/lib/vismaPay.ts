import { URL } from 'url'
import { getPublicServiceConfiguration } from '@verkkokauppa/configuration-backend'
import type { Order, VismaStatus } from '@verkkokauppa/payment-backend'
import { logger } from '@verkkokauppa/core'

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
  const redirectUrl = new URL(process.env.REDIRECT_PAYMENT_URL_BASE)

  if (!vismaStatus.valid) {
    redirectUrl.pathname = 'failure'
    return redirectUrl
  }

  const serviceSpecificRedirectUrl = await getServiceSpecificRedirectUrl({
    order,
    vismaStatus,
  })

  // No service specific configuration set OR can still retry payment in checkout
  if (isPaid(vismaStatus)) {
    redirectUrl.pathname = `${order.orderId}/success`
  } else if (canRetryPayment(vismaStatus)) {
    redirectUrl.pathname = `${order.orderId}/summary`
    redirectUrl.searchParams.append('paymentPaid', 'false')
  } else {
    redirectUrl.pathname = `${order.orderId}/failure`
  }

  return serviceSpecificRedirectUrl || redirectUrl
}

export const parseOrderIdFromRedirect = (p: { query: any }) => {
  const { query } = p

  const result = query.ORDER_NUMBER?.toString().split('_')
  return result[0]
}

const isPaid = (p: VismaStatus) => {
  const { paymentPaid } = p
  return paymentPaid
}

const canRetryPayment = (p: VismaStatus) => {
  const { paymentPaid, canRetry } = p
  return !paymentPaid && canRetry
}

const isFailure = (p: VismaStatus) => {
  const { paymentPaid, canRetry } = p
  return !paymentPaid && !canRetry
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
      const redirectUrl = new URL(
        paymentReturnUrlConfiguration.configurationValue
      )
      redirectUrl.searchParams.append('orderId', order.orderId)
      if (isPaid(vismaStatus)) {
        redirectUrl.pathname = 'success'
        return redirectUrl
      } else if (isFailure(vismaStatus)) {
        redirectUrl.pathname = 'failure'
        return redirectUrl
      }
    }
  } catch (e) {
    logger.error(e) // Return undefined if no service specific url can be generated
  }
  return undefined
}
