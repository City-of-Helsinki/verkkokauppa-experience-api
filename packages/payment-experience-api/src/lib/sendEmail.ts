import {
  createInvoiceTermsOfServiceBinary,
  sendOrderConfirmationEmailToCustomer,
} from '@verkkokauppa/message-backend'
import {
  getPaymentForOrder,
  Order,
  PaymentStatus,
} from '@verkkokauppa/payment-backend'
import { ExperienceFailure, logger } from '@verkkokauppa/core'
import {
  downloadMerchantTermsOfServiceBinary,
  getMerchantDetailsForOrder,
} from '@verkkokauppa/configuration-backend'
import { isCardRenewal } from './paymentReturnService'

const skipTosByNamespace = (process.env.SKIP_TERMS_ACCEPT_FOR_NAMESPACES || '')
  .toLowerCase()
  .split(',')

export const sendReceipt = async (
  order: Order,
  isSubscriptionRenewal: boolean
) => {
  const payments = await getPaymentForOrder(order)
  const merchant = await getMerchantDetailsForOrder(order)
  const orderWithPayments = {
    ...order,
    payment: payments,
    merchant,
  }
  const attachments: { [filename: string]: string } = {}
  if (!isSubscriptionRenewal) {
    if (payments?.status === PaymentStatus.INVOICE) {
      attachments[
        'laskutuksen-yleiset-ehdot.pdf'
      ] = createInvoiceTermsOfServiceBinary()
    }
    if (!skipTosByNamespace.includes(order.namespace)) {
      attachments[
        'asiointipalvelun-ehdot.pdf'
      ] = await downloadMerchantTermsOfServiceBinary(merchant)
    }
  }
  const email = await sendOrderConfirmationEmailToCustomer({
    order: orderWithPayments,
    emailHeader:
      'Tilausvahvistus ja kuitti / Order confirmation and receipt / Beställningsbekräftelse och kvitto',
    sendTo: orderWithPayments?.customer?.email || '',
    attachments,
  })
  if (email.error !== '' && email.error !== undefined) {
    throw new ExperienceFailure({
      code: 'failed-to-send-order-confirmation-email',
      message: `Cannot send order confirmation email to customer`,
      source: email.error,
    })
  }
  return email
}

export const sendReceiptToCustomer = async (
  paymentReturnStatus: any,
  orderId: string,
  order: any
) => {
  // Send email only when payment is paid and not an card renewal.
  if (paymentReturnStatus.paymentPaid && !isCardRenewal(paymentReturnStatus)) {
    logger.info(`Send receipt for order ${orderId}`)
    try {
      await sendReceipt(order, false)
    } catch (e) {
      // Skip errors for receipt sending
      logger.error(e)
    }
  }
}
