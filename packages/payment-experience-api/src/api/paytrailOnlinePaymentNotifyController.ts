import {
  AbstractController,
  ExperienceError,
  logger,
  StatusCode,
} from '@verkkokauppa/core'
import type { Request, Response } from 'express'
import {
  checkIfPaidLate,
  createAccountingEntryForOrder,
  getOrderAdmin,
  OrderNotFoundError,
} from '@verkkokauppa/order-backend'
import { getProductAccountingBatch } from '@verkkokauppa/product-backend'
import {
  checkPaytrailReturnUrl,
  Payment,
  updateInternalPaymentFromPaytrail,
} from '@verkkokauppa/payment-backend'
import { parseOrderIdFromPaytrailRedirect } from '../lib/paytrail'
import { parseMerchantIdFromFirstOrderItem } from '@verkkokauppa/configuration-backend'
import {
  sendErrorNotification,
  sendErrorNotificationWithOrderData,
} from '@verkkokauppa/message-backend'

export class PaytrailOnlinePaymentNotifyController extends AbstractController {
  protected readonly requestSchema = null

  protected async implementation(
    request: Request,
    response: Response
  ): Promise<any> {
    const { query } = request

    logger.info('Paytrail online payment notify controller called')

    const orderId = parseOrderIdFromPaytrailRedirect({ query })
    if (!orderId) {
      logger.error('Paytrail: No orderId specified')
      throw new OrderNotFoundError()
    }
    logger.info(`Load paytrail order ${orderId} from payment callback`)
    const order = await getOrderAdmin({ orderId })
    const merchantId = parseMerchantIdFromFirstOrderItem(order)

    if (!merchantId) {
      logger.error('Paytrail: No merchantId found from order')
      throw new ExperienceError({
        code: 'merchant-id-not-found',
        message: 'No merchantId found from order.',
        responseStatus: StatusCode.NotFound,
        logLevel: 'info',
      })
    }
    const paytrailStatus = await checkPaytrailReturnUrl({
      params: query,
      merchantId: merchantId,
    })

    logger.debug(
      `PaytrailStatus callback for order ${orderId}: ${JSON.stringify(
        paytrailStatus
      )}`
    )
    let paymentWithUpdatePaidAt: Payment
    try {
      if (!query[`checkout-stamp`]) {
        throw new Error(
          `Notify - Payment not found when updating internal payment from paytrail with orderId ${orderId}`
        )
      }
      paymentWithUpdatePaidAt = await updateInternalPaymentFromPaytrail({
        paymentId: query[`checkout-stamp`].toString(),
        merchantId: merchantId,
        namespace: order.namespace,
      })
    } catch (e) {
      logger.error(e)
      logger.debug(
        `Notify - Error occurred, when updating payment data from paytrail ${orderId}`
      )
    }

    // check if this was paid late (KYV-1196)
    if (paytrailStatus.paymentPaid) {
      const paidLate = await checkIfPaidLate({ order })
      if (paidLate) {
        // at least 15 minutes past last valid purchase datetime
        await sendErrorNotificationWithOrderData({
          orderId,
          message: `Order: ${orderId} was paid but last valid purchase datetime had already passed`,
          cause: '',
          header:
            'Error - Order was paid late, last valid purchase datetime has passed',
        })
      }
    }

    try {
      logger.info(`Load paytrail product accountings for order ${orderId}`)
      const productAccountings = await getProductAccountingBatch({
        productIds: order.items.map((item) => item.productId),
      })
      if (paytrailStatus.paymentPaid) {
        logger.info(
          `Create accounting entry for paytrail order ${orderId} with accountings ${JSON.stringify(
            productAccountings
          )}`
        )
        await createAccountingEntryForOrder({
          orderId,
          dtos: order.items.map((item) => {
            const productAccounting = productAccountings.find(
              (accountingData) => accountingData.productId === item.productId
            )
            if (!productAccounting) {
              throw new ExperienceError({
                code: 'failed-to-create-order-accounting-entry',
                message: `No accounting entry found for product ${item.productId}`,
                responseStatus: StatusCode.BadRequest,
                logLevel: 'error',
              })
            }
            return {
              ...item,
              ...productAccounting,
              merchantId: merchantId,
              namespace: order.namespace,
              paytrailTransactionId:
                paymentWithUpdatePaidAt?.paytrailTransactionId || '',
              paidAt: paymentWithUpdatePaidAt?.paidAt || '',
            }
          }),
          namespace: order.namespace,
        })
      }
    } catch (e) {
      // log error
      logger.error(
        `Creating accountings in paytrailOnlinePaymentNotifyController for order: ${orderId} failed: ${e.toString()}`
      )
      // send notification to Slack channel (email) that creating accountings failed
      await sendErrorNotification({
        message: `Creating accountings failed in paytrailOnlinePaymentNotifyController for order: ${orderId} products ${order?.items
          .map((item) => item?.productId)
          .join(',')}`,
        cause: e.toString(),
        header: 'Error - Creating order accountings failed',
      })
    }
    return this.success<any>(response, paytrailStatus)
  }
}
