import { URL } from 'url'
import { getPublicServiceConfiguration } from '@verkkokauppa/configuration-backend'
import type { Order } from '@verkkokauppa/payment-backend'

const VismaPay = require('visma-pay')

VismaPay.setPrivateKey(process.env.VISMA_PAY_PRIVATE_KEY)
VismaPay.setApiKey(process.env.VISMA_PAY_API_KEY)
export type VismaStatus = {
  isPaymentPaid: boolean
  canRetry: boolean
}
//TODO: Move visma status check to backend
export const checkVismaStatus = (p: { query: any }): VismaStatus => {
  const { query } = p
  return VismaPay.checkReturn(
    query,
    (
      error: { message: string },
      result: { RETURN_CODE: string; ORDER_NUMBER: string }
    ) => {
      if (error) {
        console.log('Got error: ' + error.message)
        throw Error('Cannot validate return url ' + error.message)
      }
      switch (result.RETURN_CODE) {
        case '0':
          console.log(`Order paid with orderId ${result.ORDER_NUMBER}`)
          return { isPaymentPaid: true, canRetry: false }
        case '1':
          console.log(`Payment failed with orderId ${result.ORDER_NUMBER}`)
          return { isPaymentPaid: false, canRetry: true }
        case '4':
          console.log(
            `Transaction status could not be updated with orderId ${result.ORDER_NUMBER}`
          )
          return { isPaymentPaid: false, canRetry: false }
        case '10':
          console.log(
            `Maintenance break on VismaPay, transaction not created for orderId ${result.ORDER_NUMBER}`
          )
          return { isPaymentPaid: false, canRetry: true }
        default:
          console.log(
            `Cannot parse RETURN_CODE for orderId ${result.ORDER_NUMBER}`
          )
          return { isPaymentPaid: false }
      }
    }
  )
}

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
