import {
  AbstractController,
  ValidatedRequest,
  ExperienceError,
  UnexpectedError,
  Data,
  RequestValidationError,
} from '@verkkokauppa/core'
import * as yup from 'yup'
import type { Response } from 'express'
import { validateApiKey } from '@verkkokauppa/configuration-backend'
import {
  getOrderAdmin,
  createRefund,
  getRefundsByOrderAdmin,
  Refund,
  RefundItem,
} from '@verkkokauppa/order-backend'
import { paidPaymentExists } from '@verkkokauppa/payment-backend'
import { calculateTotalsFromItems } from '../lib/totals'

const requestSchema = yup.object().shape({
  body: yup
    .array()
    .of(
      yup.object().shape({
        orderId: yup.string().required(),
        items: yup
          .array()
          .of(
            yup.object().shape({
              orderItemId: yup.string().required(),
              quantity: yup.number().required(),
            })
          )
          .min(1),
      })
    )
    .required(),
  headers: yup.object().shape({
    'api-key': yup.string().required(),
    namespace: yup.string().required(),
  }),
})

export class CreateRefundController extends AbstractController<
  typeof requestSchema
> {
  protected readonly requestSchema = requestSchema

  protected async implementation(
    req: ValidatedRequest<typeof requestSchema>,
    res: Response
  ): Promise<any> {
    const {
      body,
      headers: { 'api-key': apiKey, namespace },
    } = req

    await validateApiKey({ namespace, apiKey })

    const refunds: (Refund & {
      items: RefundItem[]
      confirmationUrl: string
    })[] = []

    const errors: ExperienceError[] = []

    await Promise.all(
      body.map(async ({ orderId, items }, idx) => {
        try {
          if (body.filter((i) => i.orderId === orderId).length > 1) {
            throw new RequestValidationError(
              `body contains duplicate orderId ${orderId}`
            )
          }
          const [order, orderRefunds] = await Promise.all([
            getOrderAdmin({ orderId }),
            getRefundsByOrderAdmin({ orderId }),
          ])
          if (!(await paidPaymentExists(order))) {
            throw new RequestValidationError(
              `order ${orderId} must be paid first`
            )
          }
          type Item = { quantity: number; orderItemId: string }
          const orderItems = (items ?? order.items).map((item: Item) => {
            if (
              items &&
              items.filter((e) => e.orderItemId === item.orderItemId).length > 1
            ) {
              throw new RequestValidationError(
                `body[${idx}].items contains duplicate orderItemId ${item.orderItemId}`
              )
            }

            const orderItem = order.items.find(
              (orderItem) => orderItem.orderItemId === item.orderItemId
            )
            if (!orderItem) {
              throw new RequestValidationError(
                `order ${orderId} does not contain orderItem ${item.orderItemId}`
              )
            }
            const refundedItems = orderRefunds
              .reduce((a, r) => a.concat(r.items), [] as RefundItem[])
              .filter(
                (refundItem) => refundItem.orderItemId === item.orderItemId
              )

            const refundedQuantity = refundedItems.reduce(
              (quantity, refundItem) => quantity + refundItem.quantity,
              0
            )

            if (item.quantity + refundedQuantity > orderItem.quantity) {
              throw new RequestValidationError(
                `refunded quantity (now: ${item.quantity}, previously: ${refundedQuantity}) cannot exceed orderItem ${item.orderItemId} quantity ${orderItem.quantity}`
              )
            }

            const quantity = item.quantity
            const { priceNet, priceVat, priceGross } = orderItem

            return {
              ...orderItem,
              quantity,
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

          refunds.push({
            ...refund,
            items: refundItems,
            confirmationUrl: `${req.get('host')}/refund/${
              refund.refundId
            }/confirmAndCreatePayment`,
          })
        } catch (e) {
          if (e instanceof ExperienceError) {
            errors.push(e)
          } else {
            errors.push(new UnexpectedError(e))
          }
        }
      })
    )

    return this.success(
      res,
      new Data({
        refunds,
        ...this.errorsToResponseOutput(this.logErrors(errors)),
      }).serialize()
    )
  }
}
