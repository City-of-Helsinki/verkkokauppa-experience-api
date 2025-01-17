import {
  AbstractController,
  Data,
  ValidatedRequest,
  RequestValidationError,
} from '@verkkokauppa/core'
import type { Response } from 'express'
import * as yup from 'yup'
import {
  getMerchantDetailsWithNamespaceAndMerchantId,
  validateApiKey,
} from '@verkkokauppa/configuration-backend'
import {
  confirmRefundAdmin,
  getOrderAdmin,
  getRefundAdmin,
  getRefundsByOrderAdmin,
  RefundItem,
} from '@verkkokauppa/order-backend'
import {
  createRefundPaymentFromRefund,
  getPaidPaymentAdmin,
  RefundGateway,
} from '@verkkokauppa/payment-backend'
import { sendRefundConfirmationEmail } from '@verkkokauppa/message-backend'

const requestSchema = yup.object().shape({
  params: yup.object().shape({
    refundId: yup.string().required(),
  }),
  headers: yup.object().shape({
    'api-key': yup.string().required(),
    namespace: yup.string().required(),
  }),
})

export class ConfirmRefundController extends AbstractController<
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

    if (refund.refund.status !== 'draft') {
      throw new RequestValidationError('refund must be a draft')
    }

    const [refunds, order] = await Promise.all([
      getRefundsByOrderAdmin(refund.refund),
      getOrderAdmin(refund.refund),
    ])

    refund.items.forEach((item) => {
      const refundedItems = refunds
        .filter((r) => r.refund.status === 'confirmed')
        .reduce((a, r) => a.concat(r.items), [] as RefundItem[])
        .filter((ri) => ri.orderItemId === item.orderItemId)

      const refundedQuantity = refundedItems.reduce(
        (quantity, refundItem) => quantity + refundItem.quantity,
        0
      )

      if (
        item.quantity + refundedQuantity >
        (order.items.find((i) => i.orderId === item.orderItemId)?.quantity || 0)
      ) {
        throw new RequestValidationError(
          `refunded quantity (now: ${item.quantity}, previously: ${refundedQuantity}) cannot exceed orderItem ${item.orderItemId} quantity ${item.quantity}`
        )
      }
    })

    const confirmedRefund = await confirmRefundAdmin(refund.refund)

    const payment = await getPaidPaymentAdmin({
      orderId: order.orderId,
    })

    if (!payment) {
      throw new RequestValidationError(
        `cannot create refund without paid payment `
      )
    }

    const refundPayment = await createRefundPaymentFromRefund({
      order,
      refund: {
        refund: confirmedRefund,
        items: refund.items,
      },
      payment,
      gateway: payment?.paymentGateway || RefundGateway.PAYTRAIL.toString(),
      merchantId: refund.items[0]?.merchantId || '',
    })

    await sendRefundConfirmationEmail({
      refund: { refund: confirmedRefund, items: refund.items },
      payment,
      order,
      merchant: await getMerchantDetailsWithNamespaceAndMerchantId(
        refund.refund.namespace,
        refund.items[0]?.merchantId || ''
      ),
    })

    return this.success(
      res,
      new Data({
        refund: confirmedRefund,
        payment: refundPayment,
      }).serialize()
    )
  }
}
