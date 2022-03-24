import { sendOrderConfirmationEmailToCustomer } from '@verkkokauppa/message-backend'
import { getPaymentForOrder, Order } from '@verkkokauppa/payment-backend'
import { ExperienceFailure, logger } from '@verkkokauppa/core'
import { getMerchantDetailsForOrder } from '@verkkokauppa/configuration-backend'
import { isCardRenewal } from './vismaPay'

export const sendReceipt = async (order: Order) => {
  const payments = await getPaymentForOrder(order)
  const merchant = await getMerchantDetailsForOrder(order)
  const orderWithPayments = {
    ...order,
    payment: payments,
    merchant,
  }
  const email = await sendOrderConfirmationEmailToCustomer({
    order: orderWithPayments,
    emailHeader:
      'Tilausvahvistus ja kuitti / Order confirmation and receipt / Beställningsbekräftelse och kvitto',
    sendTo: orderWithPayments?.customer?.email || '',
  })
  if (email.error !== '') {
    throw new ExperienceFailure({
      code: 'failed-to-send-order-confirmation-email',
      message: `Cannot send order confirmation email to customer`,
      source: email.error,
    })
  }
  return email
}

export const sendReceiptToCustomer = async (
  vismaStatus: any,
  orderId: string,
  order: any
) => {
  // Send email only when payment is paid and not an card renewal.
  if (vismaStatus.paymentPaid && !isCardRenewal(vismaStatus)) {
    logger.info(`Send receipt for order ${orderId}`)
    try {
      await sendReceipt(order)
    } catch (e) {
      // Skip errors for receipt sending
      logger.error(e)
    }
  }
}
