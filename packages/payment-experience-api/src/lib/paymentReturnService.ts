import { getPublicServiceConfiguration } from '@verkkokauppa/configuration-backend'
import type {
  Order,
  PaytrailStatus,
  VismaStatus,
} from '@verkkokauppa/payment-backend'
import { PaymentType } from '@verkkokauppa/payment-backend'
import { logger } from '@verkkokauppa/core'
import { URL } from 'url'

export const isPaid = (p: VismaStatus | PaytrailStatus) => {
  const { paymentPaid } = p
  return paymentPaid
}

export const canRetryPayment = (p: VismaStatus | PaytrailStatus) => {
  const { paymentPaid, canRetry } = p
  return !paymentPaid && canRetry
}

export const isAuthorized = (p: VismaStatus | PaytrailStatus) => {
  const { paymentPaid, authorized } = p
  return !paymentPaid && authorized
}

export const isCardRenewal = (
  paymentReturnStatus: VismaStatus | PaytrailStatus
) => {
  return paymentReturnStatus.paymentType == PaymentType.CARD_RENEWAL.toString()
}

export const createUserRedirectUrl = async ({
  order,
  paymentReturnStatus,
  redirectPaymentUrlBase,
}: {
  order: Order
  paymentReturnStatus: VismaStatus | PaytrailStatus
  redirectPaymentUrlBase: string
}): Promise<URL> => {
  if (!redirectPaymentUrlBase) {
    throw new Error('No default redirect url specified')
  }
  let internalRedirectUrl = new URL(redirectPaymentUrlBase)

  if (!paymentReturnStatus.valid) {
    internalRedirectUrl.pathname = 'failure'
    return internalRedirectUrl
  }

  const serviceSpecificRedirectUrl = await getServiceSpecificRedirectUrl({
    order,
    paymentReturnStatus,
  })

  internalRedirectUrl = createPaymentRedirectUrlFromPaymentReturnStatus(
    paymentReturnStatus,
    order,
    internalRedirectUrl,
    true
  )

  return serviceSpecificRedirectUrl || internalRedirectUrl
}

export const createPaymentRedirectUrlFromPaymentReturnStatus = (
  paymentReturnStatus: VismaStatus | PaytrailStatus,
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
  if (isPaid(paymentReturnStatus)) {
    redirectUrl.pathname = `${orderId}/success`
  } else if (canRetryPayment(paymentReturnStatus)) {
    redirectUrl.pathname = `${orderId}/summary`
    redirectUrl.searchParams.append('paymentPaid', 'false')
  } else if (
    isAuthorized(paymentReturnStatus) &&
    isCardRenewal(paymentReturnStatus)
  ) {
    redirectUrl.pathname = `${orderId}/card-update-success`
  } else if (isCardRenewal(paymentReturnStatus)) {
    // If card renewal is not authorized it must be failed, so forward to card-update-failed
    redirectUrl.pathname = `${orderId}/card-update-failed`
  } else {
    redirectUrl.pathname = `${orderId}/failure`
  }
  return redirectUrl
}

const getServiceSpecificRedirectUrl = async (p: {
  order: Order
  paymentReturnStatus: VismaStatus | PaytrailStatus
}): Promise<URL | undefined> => {
  const { order, paymentReturnStatus } = p
  try {
    const paymentReturnUrlConfiguration = await getPublicServiceConfiguration({
      namespace: order.namespace,
      key: 'ORDER_CREATED_REDIRECT_URL', //TODO: Rename to ORDER_SUCCESS_REDIRECT_URL
    })
    if (
      paymentReturnUrlConfiguration.configurationValue &&
      paymentReturnUrlConfiguration.configurationValue !== '' &&
      !canRetryPayment(paymentReturnStatus)
    ) {
      // Use service redirect url if configuration is set
      let redirectUrl = new URL(
        paymentReturnUrlConfiguration.configurationValue
      )

      redirectUrl.searchParams.append('orderId', order.orderId)

      redirectUrl = createPaymentRedirectUrlFromPaymentReturnStatus(
        paymentReturnStatus,
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
