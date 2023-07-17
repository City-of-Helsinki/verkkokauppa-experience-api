import {
  AbstractController,
  Data,
  ExperienceError,
  RequestValidationError,
  UnexpectedError,
  ValidatedRequest,
} from '@verkkokauppa/core'
import * as yup from 'yup'
import type { Response } from 'express'
import { validateApiKey } from '@verkkokauppa/configuration-backend'
import {
  confirmRefundAdmin,
  createRefund,
  getOrderAdmin,
  getRefundsByOrderAdmin,
  calculateTotalsFromItems,
  OrderItem,
  Refund,
  RefundItem,
} from '@verkkokauppa/order-backend'
import {
  createRefundPaymentFromRefund,
  getPaidPaymentAdmin,
  paidPaymentExists,
  RefundGateway,
} from '@verkkokauppa/payment-backend'

const requestSchema = yup.object().shape({
  params: yup.object().shape({
    orderId: yup.string().required(),
  }),
  headers: yup.object().shape({
    'api-key': yup.string().required(),
    namespace: yup.string().required(),
  }),
})

export class InstantRefundController extends AbstractController<
  typeof requestSchema
> {
  protected readonly requestSchema = requestSchema

  constructor() {
    super()
  }

  protected async implementation(
    req: ValidatedRequest<typeof requestSchema>,
    res: Response
  ): Promise<any> {
    const {
      params: { orderId },
      headers: { 'api-key': apiKey, namespace },
    } = req

    await validateApiKey({ namespace, apiKey })

    const refunds: (Refund & {
      items: RefundItem[]
      payment?: unknown
    })[] = []

    const errors: ExperienceError[] = []

    const order = await getOrderAdmin({ orderId })
    const paidPaymentExistsForOrder = await paidPaymentExists({
      orderId: order.orderId,
      namespace: order.namespace,
      user: order.user,
    })

    const items = order.items
    try {
      if (!paidPaymentExistsForOrder) {
        throw new RequestValidationError(`order ${orderId} must be paid first`)
      }

      const orderRefunds = await getRefundsByOrderAdmin({ orderId })

      const orderItems = items.map((item: OrderItem) => {
        const refundedItems = orderRefunds
          .reduce((a, r) => a.concat(r.items), [] as RefundItem[])
          .filter((refundItem) => refundItem.orderItemId === item.orderItemId)

        const refundedQuantity = refundedItems.reduce(
          (quantity, refundItem) => quantity + refundItem.quantity,
          0
        )

        if (item.quantity + refundedQuantity > item.quantity) {
          throw new RequestValidationError(
            `refunded quantity (now: ${item.quantity}, previously: ${refundedQuantity}) cannot exceed orderItem ${item.orderItemId} quantity ${item.quantity}`
          )
        }

        const quantity = item.quantity
        const { priceNet, priceVat, priceGross } = item

        return {
          ...item,
          rowPriceNet: (parseFloat(priceNet) * quantity).toString(),
          rowPriceVat: (parseFloat(priceVat) * quantity).toString(),
          rowPriceTotal: (parseFloat(priceGross) * quantity).toString(),
        }
      })

      const { refund, items: refundItems } = await createRefund({
        order: {
          ...order,
          ...calculateTotalsFromItems({ items: orderItems }),
          items: orderItems,
        },
      })

      const confirmedRefund = await confirmRefundAdmin(refund)

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
          items: refundItems,
        },
        payment,
        gateway: RefundGateway.PAYTRAIL.toString(),
        merchantId: refundItems[0]?.merchantId || '',
      })

      refunds.push({
        ...confirmedRefund,
        items: refundItems,
        payment: refundPayment,
      })
    } catch (e) {
      if (e instanceof ExperienceError) {
        errors.push(e)
      } else {
        errors.push(new UnexpectedError(e))
      }
    }

    return this.success(
      res,
      new Data({
        refunds,
        ...this.errorsToResponseOutput(this.logErrors(errors)),
      }).serialize()
    )
  }
}
