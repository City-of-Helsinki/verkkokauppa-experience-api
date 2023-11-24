import {
  AbstractController,
  ExperienceError,
  logger,
  StatusCode,
  ValidatedRequest,
} from '@verkkokauppa/core'
import * as yup from 'yup'
import type { Response } from 'express'
import {
  parseMerchantIdFromFirstOrderItem,
  validateApiKey,
} from '@verkkokauppa/configuration-backend'
import {
  createAccountingEntryForOrder,
  getOrderAdmin,
} from '@verkkokauppa/order-backend'
import { getProductAccountingBatch } from '@verkkokauppa/product-backend'
import { sendReceipt } from '../lib/sendEmail'
import { sendErrorNotification } from '@verkkokauppa/message-backend'

const requestSchema = yup.object().shape({
  headers: yup.object().shape({
    'api-key': yup.string().required(),
    namespace: yup.string().required(),
  }),
  query: yup.object().shape({
    orderId: yup.string().required(),
  }),
})

export class PaytrailMitChargeNotifyController extends AbstractController<
  typeof requestSchema
> {
  protected readonly requestSchema = requestSchema

  protected async implementation(
    req: ValidatedRequest<typeof requestSchema>,
    res: Response
  ) {
    const {
      headers: { 'api-key': apiKey, namespace },
      query: { orderId },
    } = req

    await validateApiKey({ namespace, apiKey })

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

    try {
      const productAccountings = await getProductAccountingBatch({
        productIds: order.items.map((item) => item.productId),
      })

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
    } catch (e) {
      // log error
      logger.error(
        'Creating accountings in paytrailMitChargeNotifyController failed: ' +
          e.toString()
      )
      // send notification to Slack channel (email) that creating accountings failed
      await sendErrorNotification({
        message:
          'Creating accountings failed in paytrailMitChargeNotifyController',
        cause: e.toString(),
      })
      // rethrow error
      throw e
    }

    await sendReceipt(order, true)

    return this.success(res)
  }
}
