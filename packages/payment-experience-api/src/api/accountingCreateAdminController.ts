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
  validateAdminApiKey,
} from '@verkkokauppa/configuration-backend'
import {
  createAccountingEntryForOrder,
  getOrderAdmin,
  OrderAccounting,
} from '@verkkokauppa/order-backend'
import { getProductAccountingBatch } from '@verkkokauppa/product-backend'
import { sendErrorNotification } from '@verkkokauppa/message-backend'
import {
  Payment,
  PaymentStatus,
  updateInternalPaymentFromPaytrail,
} from '@verkkokauppa/payment-backend'

const requestSchema = yup.object().shape({
  headers: yup.object().shape({
    'api-key': yup.string().required(),
  }),
  body: yup.object().shape({
    orderId: yup.string().required(),
    paymentId: yup.string().required(),
  }),
})

export class AccountingCreateAdminController extends AbstractController<
  typeof requestSchema
> {
  protected readonly requestSchema = requestSchema

  protected async implementation(
    req: ValidatedRequest<typeof requestSchema>,
    res: Response
  ) {
    const {
      headers: { 'api-key': apiKey },
      body: { orderId, paymentId },
    } = req

    await validateAdminApiKey({ apiKey })

    const order = await getOrderAdmin({ orderId })
    const merchantId = parseMerchantIdFromFirstOrderItem(order)

    if (!merchantId) {
      logger.error('AccountingAdmin: No merchantId found from order')
      throw new ExperienceError({
        code: 'merchant-id-not-found',
        message: 'No merchantId found from order.',
        responseStatus: StatusCode.NotFound,
        logLevel: 'info',
      })
    }

    let paymentWithUpdatePaidAt: Payment
    try {
      if (!paymentId) {
        throw new Error(
          `AccountingAdmin - Payment not found when updating internal payment from paytrail with orderId ${orderId}`
        )
      }
      paymentWithUpdatePaidAt = await updateInternalPaymentFromPaytrail({
        paymentId: paymentId,
        merchantId: merchantId,
        namespace: order.namespace,
      })
      if (
        paymentWithUpdatePaidAt &&
        paymentWithUpdatePaidAt.status !== PaymentStatus.PAID_ONLINE.toString()
      ) {
        throw new ExperienceError({
          code: 'failed-to-create-order-accounting-entry',
          message: `No paid account entry found for product ${orderId}`,
          responseStatus: StatusCode.BadRequest,
          logLevel: 'error',
        })
      }
    } catch (e) {
      if (
        e instanceof ExperienceError &&
        e?.definition?.responseStatus === StatusCode.BadRequest
      ) {
        throw e
      }
      logger.error(e)
      logger.debug(
        `AccountingAdmin - Error occurred, when updating payment data from paytrail ${orderId}`
      )
    }
    let orderAccounting: OrderAccounting | null | string = null
    try {
      const productAccountings = await getProductAccountingBatch({
        productIds: order.items.map((item) => item.productId),
      })

      orderAccounting = await createAccountingEntryForOrder({
        orderId,
        dtos: order.items.map((item) => {
          const productAccounting = productAccountings.find(
            (accountingData) => accountingData.productId === item.productId
          )
          if (!productAccounting) {
            throw new ExperienceError({
              code: 'admin-failed-to-create-order-accounting-entry',
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
    } catch (e) {
      // log error
      logger.error(
        'Creating accountings in AccountingAdmin failed: ' + e.toString()
      )
      // send notification to Slack channel (email) that creating accountings failed
      await sendErrorNotification({
        message: `Creating accountings failed in AccountingAdmin for order ${orderId} products ${order?.items
          .map((item) => item?.productId)
          .join(',')} paymentId ${paymentId}`,
        cause: e.toString(),
      })
    }

    const accountingExists =
      typeof orderAccounting === 'string' &&
      orderAccounting?.trim().length === 0

    if (accountingExists) {
      throw new ExperienceError({
        code: 'admin-order-accounting-entry-exist',
        message: `Accounting entry already exists for order ${orderId}`,
        responseStatus: StatusCode.Conflict,
        logLevel: 'info',
      })
    }

    return this.created(res, orderAccounting)
  }
}
