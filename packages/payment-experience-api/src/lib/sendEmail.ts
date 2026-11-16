import {
  sendOrderConfirmationEmailToCustomer,
  loadPDFFromDir,
  sendErrorNotification,
} from '@verkkokauppa/message-backend'
import {
  getPaymentForOrder,
  Order,
  PaymentGateway,
} from '@verkkokauppa/payment-backend'
import { ExperienceFailure, logger } from '@verkkokauppa/core'
import {
  downloadMerchantTermsOfServiceBinary,
  getMerchantDetailsForOrder,
} from '@verkkokauppa/configuration-backend'
import { isCardRenewal } from './paymentReturnService'
import {
  createTicketPdf,
  createBarQrCode,
  getOrderConfirmationPdf,
  barQRCodeCheck,
} from '@verkkokauppa/order-backend'
import axios from 'axios'

const skipTosByNamespace = (process.env.SKIP_TERMS_ACCEPT_FOR_NAMESPACES || '')
  .toLowerCase()
  .split(',')

const QR_CODE_WIDTH_IN_PDF = 600
const QR_CODE_HEIGHT_IN_PDF = 600

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
    if (
      payments?.paymentGateway != null &&
      payments?.paymentGateway === PaymentGateway.INVOICE
    ) {
      attachments[
        'Laskutusta-koskevat-yleiset-ehdot.pdf'
      ] = await loadPDFFromDir(
        process.env.INVOICING_TERMS_PATH || 'src/public', // try to use env for invoicing terms path but default to src/public
        process.env.INVOICING_TERMS_FILENAME ||
          'Laskutusta-koskevat-yleiset-ehdot.pdf'
      )
    }

    // if flag exists and is NOT set to false or
    // if flag is not defined and not skipping by old logic
    // then include terms
    if (
      (merchant &&
        merchant.sendMerchantTermsOfService !== undefined &&
        !(merchant.sendMerchantTermsOfService.toUpperCase() == 'FALSE')) ||
      (merchant &&
        merchant.sendMerchantTermsOfService == undefined &&
        !skipTosByNamespace.includes(order.namespace))
    ) {
      logger.info(
        `Include terms of service to receipt for order ${order.orderId} from ${merchant.merchantTermsOfServiceUrl}`
      )
      attachments[
        'asiointipalvelun-ehdot.pdf'
      ] = await downloadMerchantTermsOfServiceBinary(merchant)
    }
  }
  // confirmation PDF is sent regardless of the order type
  const confirmationPdf = await getOrderConfirmationPdf(order.orderId)
  if (confirmationPdf !== undefined) {
    attachments['kuitti-kvitto-receipt.pdf'] = confirmationPdf
  }
  // if orderItem has tokenName defined, add QR Code
  for (const item of order.items) {
    if (item?.tokenName) {
      const pdfName = `lippu-biljet-ticket-${item.orderItemId}.pdf`
      // if tokenQRCodeUrl exists, use it to fetch QR code
      if (item?.tokenQRCodeUrl) {
        const url = item.tokenQRCodeUrl
        try {
          const result = await axios.get<ArrayBuffer>(url, {
            responseType: 'arraybuffer',
          })
          if (result.status === 200) {
            logger.debug(`Fetching QR Code from ${url}`)
            attachments[pdfName] = await createTicketPdf(
              result.data,
              QR_CODE_HEIGHT_IN_PDF,
              QR_CODE_WIDTH_IN_PDF
            )
            continue
          } else {
            logger.warn(
              `Fetching QR Code from ${url} failed: ${result.statusText}`
            )
          }
        } catch (error) {
          logger.warn(`Fetching QR Code from ${url} failed: `, error)
        }
      }

      // if tokenQRCodeUrl does not exist or fetching QR code fails, create QR code
      try {
        logger.debug(`Creating QR code.`)
        const barQrCode = await createBarQrCode(
          merchant.merchantBarQRCodeType,
          item.tokenName
        )
        attachments[pdfName] = await createTicketPdf(
          barQrCode,
          QR_CODE_HEIGHT_IN_PDF / 2,
          QR_CODE_WIDTH_IN_PDF / 2
        )
      } catch (error) {
        const errorText = `Creating QR Code failed: ` + error
        logger.error(errorText)
        // send notification to Slack channel (email) that sending receipt failed
        await sendErrorNotification({
          message: `Creating QR code for order ${item.orderId} failed`,
          cause: errorText,
          header: 'Warning - Creating QR code failed',
        })
      }
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
  order: any,
  doBarQrCodeCheck: boolean = false,
  merchantId: string | null = null
) => {
  // KYV-1449 token charge request needs also to be asynchronic
  if (doBarQrCodeCheck && merchantId) {
    logger.debug(`Doing Barcode check for order ${orderId}`)
    // KYV-1402
    // get QR code if this is voucher purchase
    try {
      order.items = await barQRCodeCheck({
        merchantId,
        namespace: order.namespace,
        items: order.items,
      })
    } catch (e) {
      logger.error(e)
      logger.debug(`Error occurred, when checking for barcode ${orderId}`)
    }
    logger.debug(`Barcode check done for order ${orderId}`)
  }

  // Send email only when payment is paid and not an card renewal.
  if (paymentReturnStatus.paymentPaid && !isCardRenewal(paymentReturnStatus)) {
    logger.info(`Send receipt for order ${orderId}`)
    try {
      await sendReceipt(order, false)
    } catch (e) {
      // Skip errors for receipt sending
      logger.error(e)

      // send notification to Slack channel (email) that sending receipt failed
      await sendErrorNotification({
        message: `Sending receipt failed for order ${orderId}`,
        cause: e.toString(),
        header: 'Error - Sending receipt failed',
      })
    }
  }
}
