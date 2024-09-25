import {
  AbstractController,
  logger,
  ValidatedRequest,
} from '@verkkokauppa/core'
import type { Response } from 'express'
import * as yup from 'yup'
import { validateApiKey } from '@verkkokauppa/configuration-backend'
import { getOrderAdmin, getRefundAdmin } from '@verkkokauppa/order-backend'
import { getRefundPaymentForOrderAdmin } from '@verkkokauppa/payment-backend'
const requestSchema = yup.object().shape({
  params: yup.object().shape({
    refundId: yup.string().required(),
  }),
  headers: yup.object().shape({
    'api-key': yup.string().required(),
    namespace: yup.string().required(),
  }),
})

export class GetRefundController extends AbstractController<
  typeof requestSchema
> {
  protected readonly requestSchema = requestSchema

  protected async implementation(
    req: ValidatedRequest<typeof requestSchema>,
    res: Response
  ) {
    const {
      params: { refundId },
      headers: { 'api-key': apiKey, namespace },
    } = req
    await validateApiKey({ namespace, apiKey })

    const refund = await getRefundAdmin({ refundId })

    const order = await getOrderAdmin(refund.refund)

    let refundPayment = null
    try {
      refundPayment = await getRefundPaymentForOrderAdmin({
        orderId: order.orderId,
      })
    } catch (e) {
      logger.info(
        `Refund payment not found for refundId: ${refundId} orderId: ${order.orderId}`
      )
    }

    return this.success(res, {
      ...refund,
      payment: refundPayment,
    })
  }
}
