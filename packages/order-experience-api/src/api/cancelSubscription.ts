import {
  AbstractController,
  Data,
  logger,
  ValidatedRequest,
} from '@verkkokauppa/core'
import type { Response } from 'express'
import { cancelSubscription } from '@verkkokauppa/order-backend'
import { URL } from 'url'
import * as yup from 'yup'

const requestSchema = yup.object().shape({
  params: yup.object().shape({
    subscriptionId: yup.string().required(),
  }),
  headers: yup.object().shape({
    user: yup.string().required(),
  }),
})

export class CancelSubscription extends AbstractController<
  typeof requestSchema
> {
  protected readonly requestSchema = requestSchema

  protected async implementation(
    req: ValidatedRequest<typeof requestSchema>,
    res: Response
  ): Promise<any> {
    const {
      params: { subscriptionId },
      headers: { user },
    } = req

    logger.debug(`Cancel Subscription ${subscriptionId}`)

    const subscription = await cancelSubscription({ id: subscriptionId, user })

    return this.success<any>(res, new Data(subscription).serialize())
  }
}
