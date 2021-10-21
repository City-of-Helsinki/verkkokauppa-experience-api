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
    const merchant = await getMerchantDetailsForOrder(order)

    const dto = new Data({
      ...order,
      merchant,
    })

    return this.success<any>(res, dto.serialize())
  }
}
