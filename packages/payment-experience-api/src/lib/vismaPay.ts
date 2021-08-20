import { URL } from 'url'
import { getPublicServiceConfiguration } from '@verkkokauppa/configuration-backend'
import type { Order, VismaStatus } from '@verkkokauppa/payment-backend'

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
  let redirectUrl = new URL(process.env.REDIRECT_PAYMENT_URL_BASE)

  if (!vismaStatus.valid) {
    redirectUrl.pathname = 'failure'
    return redirectUrl
  }
  try {
    const paymentReturnUrlConfiguration = await getPublicServiceConfiguration({
      namespace: order.namespace,
      key: 'PAYMENT_RETURN_URL',
    })
    if (paymentReturnUrlConfiguration.configurationValue !== '') {
      redirectUrl = new URL(paymentReturnUrlConfiguration.configurationValue)
      redirectUrl.pathname = vismaStatus.paymentPaid ? 'success' : 'failure'
      redirectUrl.searchParams.append('orderId', order.orderId)
      return redirectUrl
    }
  } catch (e) {
    console.log(e)
    //Redirect url is already default if exception is caught when fetching configuration
  }

  if (vismaStatus.paymentPaid) {
    redirectUrl.pathname = `${order.orderId}/success`
  } else if (!vismaStatus.paymentPaid && vismaStatus.canRetry) {
    redirectUrl.pathname = `${order.orderId}/summary`
    redirectUrl.searchParams.append('paymentPaid', 'false')
  } else {
    redirectUrl.pathname = `${order.orderId}/failure`
  }

  return redirectUrl
}
