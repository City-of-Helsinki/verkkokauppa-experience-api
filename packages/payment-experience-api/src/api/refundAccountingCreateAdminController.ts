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
  createAccountingEntryForRefund,
  getOrderAdmin,
  getRefundAdmin,
  RefundAccounting,
} from '@verkkokauppa/order-backend'
import { getProductAccountingBatch } from '@verkkokauppa/product-backend'
import {
  getPaidRefundPaymentAdmin,
  getPaidRefundPaymentAdminByRefundId,
  RefundPayment,
  RefundPaymentStatus,
  updateInternalRefundFromPaytrail,
} from '@verkkokauppa/payment-backend'
import { sendErrorNotification } from '@verkkokauppa/message-backend'

const requestSchema = yup.object().shape({
  headers: yup.object().shape({
    'api-key': yup.string().required(),
  }),
  body: yup.object().shape({
    orderId: yup.string().required(),
    refundId: yup.string().required(),
  }),
})

export class RefundAccountingCreateAdminController extends AbstractController<
  typeof requestSchema
> {
  protected readonly requestSchema = requestSchema

  protected async implementation(
    req: ValidatedRequest<typeof requestSchema>,
    res: Response
  ) {
    const {
      headers: { 'api-key': apiKey },
      body: { orderId, refundId },
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

    let shouldBePaidPayment: RefundPayment | null
    try {
      try {
        shouldBePaidPayment = await updateInternalRefundFromPaytrail({
          refundId: refundId,
          merchantId: merchantId,
          namespace: order.namespace,
        })
      } catch (e) {
        logger.info(
          `Failed to update ${refundId} from paytrail, try to use from current refund`
        )
        shouldBePaidPayment = await getPaidRefundPaymentAdmin({
          orderId,
        })
      }
      if (
        shouldBePaidPayment &&
        shouldBePaidPayment.status !==
          RefundPaymentStatus.PAID_ONLINE.toString()
      ) {
        throw new ExperienceError({
          code: 'failed-to-create-refund-accounting-entry',
          message: `No paid account entry found for order ${orderId} refundId: ${refundId}`,
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
        `AccountingRefundAdmin - Error occurred, when updating refund data from paytrail ${orderId} refundId: ${refundId}`
      )
    }
    const refund = await getRefundAdmin({ refundId })
    const refundPayment = await getPaidRefundPaymentAdminByRefundId({
      refundId,
    })
    let refundAccounting: RefundAccounting | null = null
    try {
      const productAccountings = await getProductAccountingBatch({
        productIds: refund.items.map((item) => item.productId),
      })
      refundAccounting = await createAccountingEntryForRefund({
        refundId: refundId,
        orderId: orderId,
        namespace: order.namespace,
        dtos: refund.items.map((item) => {
          const productAccounting = productAccountings.find(
            (accountingData) => accountingData.productId === item.productId
          )
          if (!productAccounting) {
            throw new ExperienceError({
              code: 'failed-to-create-refund-accounting-entry',
              message: `No accounting entry found for product ${item.productId}`,
              responseStatus: StatusCode.BadRequest,
              logLevel: 'error',
            })
          }
          const refundPaymentTyped = (refundPayment as unknown) as RefundPayment
          return {
            ...item,
            ...productAccounting,
            merchantId: merchantId,
            namespace: order.namespace,
            refundTransactionId: refundPaymentTyped?.refundTransactionId || '',
            refundCreatedAt: refundPaymentTyped?.createdAt || '',
          }
        }),
      })
    } catch (error) {
      // only write error to log
      logger.debug(
        `Error occurred while trying to create accounting for refund with id: ${refundId}`
      )
      logger.error(error)
      await sendErrorNotification({
        message: `Admin- Error occurred while trying to create accounting for refund with id: ${refundId}`,
        cause: error,
      })
    }

    return this.created(res, refundAccounting)
  }
}
