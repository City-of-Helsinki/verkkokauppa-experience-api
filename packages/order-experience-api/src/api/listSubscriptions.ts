import {
  AbstractController,
  Data,
  logger,
  ValidatedRequest,
} from '@verkkokauppa/core'
import type { Response } from 'express'
import { listSubscriptions } from '@verkkokauppa/order-backend'
import * as yup from 'yup'

const requestSchema = yup.object().shape({
  params: yup.object().shape({
    orderId: yup.string().required(),
  }),
  headers: yup.object().shape({
    user: yup.string().required(),
  }),
})

export class ListSubscriptionsController extends AbstractController<
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

    logger.debug(`Fetch subscriptions with order id ${orderId}`)

    const dto = new Data(await listSubscriptions({ orderId, user }))

    return this.success<any>(res, dto.serialize())
  }
}
