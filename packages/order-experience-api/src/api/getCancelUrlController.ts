import {
  AbstractController,
  Data,
  logger,
  ValidatedRequest,
} from '@verkkokauppa/core'
import type { Response } from 'express'
import { getOrder } from '@verkkokauppa/order-backend'
import * as yup from 'yup'
import { CancelController } from './cancelController'

const requestSchema = yup.object().shape({
  params: yup.object().shape({
    orderId: yup.string().required(),
  }),
  headers: yup.object().shape({
    user: yup.string().required(),
  }),
})

export class GetCancelController extends AbstractController<
  typeof requestSchema
> {
  protected readonly requestSchema = requestSchema

  protected async implementation(
    req: ValidatedRequest<typeof requestSchema>,
    res: Response
  ): Promise<any> {
    const {
      params: { orderId },
      headers: { user },
    } = req

    logger.debug(`Get order cancel url ${orderId}`)

    const order = await getOrder({ orderId, user })
    const cancelUrl = await CancelController.createCancelUrl(order)

    return this.success<any>(
      res,
      new Data({
        order,
        cancelUrl,
      }).serialize()
    )
  }
}
