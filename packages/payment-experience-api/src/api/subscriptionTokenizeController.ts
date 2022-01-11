import {
  AbstractController,
  Data,
  logger,
  ValidatedRequest,
} from '@verkkokauppa/core'
import type { Response } from 'express'
import { getOrder, getSubscription } from '@verkkokauppa/order-backend'
import * as yup from 'yup'
import { createAuthorizedPaymentAndGetCardUpdateUrl } from '@verkkokauppa/payment-backend'

const requestSchema = yup.object().shape({
  params: yup.object().shape({
    subscriptionId: yup.string().required(),
  }),
  headers: yup.object().shape({
    user: yup.string().required(),
  }),
})

export class SubscriptionTokenizeController extends AbstractController<
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

    logger.debug(`Card renewal for subscription: ${subscriptionId}`)

    const subscription = await getSubscription({
      id: subscriptionId || '',
      user: user,
    })

    const order = await getOrder({ orderId: subscription.orderId || '', user })

    const paymentUrl = await createAuthorizedPaymentAndGetCardUpdateUrl(order)

    return this.success<any>(
      res,
      new Data({
        paymentUrl,
      }).serialize()
    )
  }
}
