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

  if (!vismaStatus.isValid) {
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
    }
  } catch (e) {
    console.log(e)
    //Redirect url is already default if exception is caught when fetching configuration
  }

  redirectUrl.pathname = `${order.orderId}/${
    vismaStatus.isPaymentPaid ? 'success' : 'failure'
  }`

  if (!vismaStatus.isPaymentPaid) {
    redirectUrl.searchParams.append('retry', vismaStatus.canRetry.toString())
  }
  return redirectUrl
}
