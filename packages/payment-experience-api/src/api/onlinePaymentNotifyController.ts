import {
  AbstractController,
  ExperienceError,
  logger,
  StatusCode,
} from '@verkkokauppa/core'
import type { Request, Response } from 'express'
import { parseOrderIdFromRedirect } from '../lib/vismaPay'
import {
  createAccountingEntryForOrder,
  getOrderAdmin,
  OrderNotFoundError,
} from '@verkkokauppa/order-backend'
import { getProductAccountingBatch } from '@verkkokauppa/product-backend'
import { checkVismaReturnUrl } from '@verkkokauppa/payment-backend'

export class OnlinePaymentNotifyController extends AbstractController {
  protected readonly requestSchema = null

  protected async implementation(
    request: Request,
    response: Response
  ): Promise<any> {
    const { query } = request
    const vismaStatus = await checkVismaReturnUrl({ params: query })
    const orderId = parseOrderIdFromRedirect({ query })

    logger.info('Online payment notify controller called')

    if (!orderId) {
      logger.error('No orderId specified')
      throw new OrderNotFoundError()
    }
    logger.debug(
      `VismaStatus callback for order ${orderId}: ${JSON.stringify(
        vismaStatus
      )}`
    )
    logger.info(`Load order ${orderId} from payment callback`)
    const order = await getOrderAdmin({ orderId })
    logger.info(`Load product accountings for order ${orderId}`)
    const productAccountings = await getProductAccountingBatch({
      productIds: order.items.map((item) => item.productId),
    })
    if (vismaStatus.paymentPaid) {
      logger.info(
        `Create accounting entry for order ${orderId} with accountings ${JSON.stringify(
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
        namespace: order.namespace,
      })
    }
    return this.success<any>(response, vismaStatus)
  }
}
