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
import {
  getMerchantDetailsWithNamespaceAndMerchantId,
  validateApiKey,
} from '@verkkokauppa/configuration-backend'
import {
  confirmRefundAdmin,
  createRefund,
  getOrderAdmin,
  getRefundsByOrderAdmin,
  calculateTotalsFromItems,
  Refund,
  RefundItem,
} from '@verkkokauppa/order-backend'
import {
  createRefundPaymentFromRefund,
  getPaidPaymentAdmin,
  paidPaymentExists,
  RefundGateway,
} from '@verkkokauppa/payment-backend'
import { sendRefundConfirmationEmail } from '@verkkokauppa/message-backend'

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

  constructor(
    private readonly opts: {
      confirmAndCreatePayment: boolean
    }
  ) {
    super()
  }

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
      confirmationUrl?: string
      payment?: unknown
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

          if (!this.opts.confirmAndCreatePayment) {
            return refunds.push({
              ...refund,
              items: refundItems,
              confirmationUrl: `${req.get('host')}/refund/${
                refund.refundId
              }/confirm`,
            })
          }

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
            gateway:
              payment?.paymentGateway || RefundGateway.PAYTRAIL.toString(),
            merchantId: refundItems[0]?.merchantId || '',
          })

          refunds.push({
            ...confirmedRefund,
            items: refundItems,
            payment: refundPayment,
          })

          return await sendRefundConfirmationEmail({
            refund: { refund: confirmedRefund, items: refundItems },
            payment,
            order,
            merchant: await getMerchantDetailsWithNamespaceAndMerchantId(
              refund.namespace,
              refundItems[0]?.merchantId || ''
            ),
          })
        } catch (e) {
          if (e instanceof ExperienceError) {
            return errors.push(e)
          } else {
            return errors.push(new UnexpectedError(e))
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
