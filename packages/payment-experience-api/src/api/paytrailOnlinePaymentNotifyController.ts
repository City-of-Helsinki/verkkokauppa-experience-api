import {
  AbstractController,
  ExperienceError,
  logger,
  StatusCode,
} from '@verkkokauppa/core'
import type { Request, Response } from 'express'
import {
  createAccountingEntryForOrder,
  getOrderAdmin,
  OrderNotFoundError,
} from '@verkkokauppa/order-backend'
import { getProductAccountingBatch } from '@verkkokauppa/product-backend'
import { checkPaytrailReturnUrl } from '@verkkokauppa/payment-backend'
import { parseOrderIdFromPaytrailRedirect } from '../lib/paytrail'
import { parseMerchantIdFromFirstOrderItem } from '@verkkokauppa/configuration-backend'
import { sendErrorNotification } from '@verkkokauppa/message-backend'

export class PaytrailOnlinePaymentNotifyController extends AbstractController {
  protected readonly requestSchema = null

  protected async implementation(
    request: Request,
    response: Response
  ): Promise<any> {
    const { query } = request

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

    logger.info('Paytrail online payment notify controller called')

    logger.debug(
      `PaytrailStatus callback for order ${orderId}: ${JSON.stringify(
        paytrailStatus
      )}`
    )

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
            }
          }),
        })
      }
    } catch (e) {
      // log error
      logger.error(
        'Creating accountings in paytrailOnlinePaymentNotifyController failed: ' +
          e.toString()
      )
      // send notification to Slack channel (email) that creating accountings failed
      await sendErrorNotification({
        message:
          'Creating accountings failed in paytrailOnlinePaymentNotifyController',
        cause: e.toString(),
      })
      // rethrow error
      throw e
    }
    return this.success<any>(response, paytrailStatus)
  }
}
