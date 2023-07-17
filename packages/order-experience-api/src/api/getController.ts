import {
  AbstractController,
  Data,
  logger,
  ValidatedRequest,
} from '@verkkokauppa/core'
import type { Response } from 'express'
import { getOrder } from '@verkkokauppa/order-backend'
import * as yup from 'yup'
import { getMerchantDetailsForOrder } from '@verkkokauppa/configuration-backend'
import { paidPaymentExists } from '@verkkokauppa/payment-backend'
import { isValidForCheckout } from '../lib/is-valid-for-checkout'

const requestSchema = yup.object().shape({
  params: yup.object().shape({
    orderId: yup.string().required(),
  }),
  headers: yup.object().shape({
    user: yup.string().required(),
  }),
})

export class GetController extends AbstractController<typeof requestSchema> {
  protected readonly requestSchema = requestSchema

  protected async implementation(
    req: ValidatedRequest<typeof requestSchema>,
    res: Response
  ): Promise<any> {
    const {
      params: { orderId },
      headers: { user },
    } = req
    logger.debug(`Fetch order ${orderId}`)
    const order = await getOrder({ orderId, user })

    const [merchant, orderIsPaid] = await Promise.all([
      getMerchantDetailsForOrder(order),
      paidPaymentExists(order),
    ])

    const dto = new Data({
      ...order,
      isValidForCheckout: !orderIsPaid && isValidForCheckout(order),
      merchant,
    })

    return this.success<any>(res, dto.serialize())
  }
}
