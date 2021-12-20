import * as yup from 'yup'
import type { Response } from 'express'
import { AbstractController, Data, ValidatedRequest } from '@verkkokauppa/core'
import { getOrdersBySubscription } from '@verkkokauppa/order-backend'

const requestSchema = yup.object().shape({
  params: yup.object().shape({
    id: yup.string().required(),
  }),
  headers: yup.object().shape({
    user: yup.string().required(),
  }),
})

export class GetSubscriptionOrdersController extends AbstractController<
  typeof requestSchema
> {
  protected readonly requestSchema = requestSchema

  protected async implementation(
    req: ValidatedRequest<typeof requestSchema>,
    res: Response
  ): Promise<any> {
    const {
      params: { id: subscriptionId },
      headers: { user },
    } = req

    const dto = new Data({
      orders: await getOrdersBySubscription({ subscriptionId, user }),
    })

    return this.success<any>(res, dto.serialize())
  }
}
