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
import { transformConfigurationToMerchant } from '../lib/merchant'

const requestSchema = yup.object().shape({
  params: yup.object().shape({
    orderId: yup.string().required(),
    user: yup.string().required(),
  }),
})

export class GetController extends AbstractController<typeof requestSchema> {
  protected readonly requestSchema = requestSchema

  protected async implementation(
    req: ValidatedRequest<typeof requestSchema>,
    res: Response
  ): Promise<any> {
    const { orderId, user } = req.params

    logger.debug(`Fetch order ${orderId}`)
    const order = await getOrder({ orderId, user })
    const merchantConfiguration = await getMerchantDetailsForOrder(order)

    const dto = new Data({
      ...order,
      merchant: transformConfigurationToMerchant(merchantConfiguration),
    })

    return this.success<any>(res, dto.serialize())
  }
}
