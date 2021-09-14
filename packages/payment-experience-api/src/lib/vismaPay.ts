import { URL } from 'url'
import { getPublicServiceConfiguration } from '@verkkokauppa/configuration-backend'
import type { Order, VismaStatus } from '@verkkokauppa/payment-backend'

import { getPaymentForOrder } from '@verkkokauppa/payment-backend'
import { sendEmailToCustomer } from '@verkkokauppa/message-backend'

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
      key: 'ORDER_CREATED_REDIRECT_URL',
    })
    if (
      paymentReturnUrlConfiguration.configurationValue &&
      paymentReturnUrlConfiguration.configurationValue !== '' &&
      vismaStatus.paymentPaid
    ) {
      redirectUrl = new URL(paymentReturnUrlConfiguration.configurationValue)
      redirectUrl.pathname = 'success'
      redirectUrl.searchParams.append('orderId', order.orderId)

      try {
        let payments = await getPaymentForOrder(order)

        let orderWithPayments = { ...order, payment: payments }
        const email = await sendEmailToCustomer({
          order: orderWithPayments,
          fileName: 'orderConfirmation',
          emailHeader: 'emailHeader',
          sendTo: orderWithPayments?.customer?.email || '',
        })
        if (email.error !== '') {
          throw new Error(email.error)
        }
      } catch (e) {
        // Do not stop redirecting if email sending fails.
        console.log(
          `orderConfirmation email was not sent for order ${
            order.orderId
          } error: ${e.toString()}`
        )
        console.error(e)
      }
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

export const parseOrderIdFromRedirect = (p: { query: any }) => {
  const { query } = p

  const result = query.ORDER_NUMBER?.toString().split('_')
  return result[0]
}
