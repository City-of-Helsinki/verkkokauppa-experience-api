import { AbstractController, logger } from '@verkkokauppa/core'
import type { Request, Response } from 'express'
import { parseRefundIdFromPaytrailRefundCallbackUrl } from '../lib/paytrail'
import { getOrderAdmin, getRefundAdmin } from '@verkkokauppa/order-backend'
import { parseMerchantIdFromFirstOrderItem } from '@verkkokauppa/configuration-backend'
import { checkPaytrailRefundCallbackUrl } from '@verkkokauppa/payment-backend'
import { sendErrorNotification } from '@verkkokauppa/message-backend'

export class PaytrailOnlineRefundPaymentCancelController extends AbstractController {
  protected readonly requestSchema = null

  protected async implementation(
    request: Request,
    result: Response
  ): Promise<any> {
    const { query } = request

    logger.info('request: ', { headers: request.headers, query: request.query })

    const refundId = parseRefundIdFromPaytrailRefundCallbackUrl({ query })

    if (!refundId) {
      logger.error('No refundId specified')
      return this.success(result)
    }

    try {
      const refund = await getRefundAdmin({ refundId })
      const orderId = refund.refund.orderId
      const order = await getOrderAdmin({ orderId })
      const merchantId = parseMerchantIdFromFirstOrderItem(order)

      if (!merchantId) {
        logger.error('Paytrail: No merchantId found from order')
        return this.success(result)
      }

      const status = await checkPaytrailRefundCallbackUrl({
        params: query,
        merchantId: merchantId,
      })

      if (!status.valid) {
        logger.error('invalid signature')
        return this.success(result)
      }

      await sendErrorNotification({
        message: `${JSON.stringify({
          request: {
            url: request.url,
            headers: request.headers,
            query,
          },
          refundId,
          orderId,
          refundPaymentStatus: status,
        })}`,
        cause: 'Paytrail refund payment cancel controller called',
        header: 'Error - Refund cancel controller called',
      })

      return this.success(result)
    } catch (e) {
      logger.error(e)
      return this.success(result)
    }
  }
}
