import { AbstractController, ValidatedRequest } from '@verkkokauppa/core'
import * as yup from 'yup'
import type { Response } from 'express'
import { sendSubscriptionPaymentFailedEmailToCustomer } from '@verkkokauppa/message-backend'
import {
  getOrderAdmin,
  getSubscriptionAdmin,
} from '@verkkokauppa/order-backend'
import { validateApiKey } from '@verkkokauppa/configuration-backend'

const requestSchema = yup.object().shape({
  params: yup.object().shape({
    id: yup.string().required(),
  }),
  headers: yup.object().shape({
    'api-key': yup.string().required(),
  }),
})

export class SendSubscriptionPaymentFailedEmail extends AbstractController<
  typeof requestSchema
> {
  protected readonly requestSchema = requestSchema

  protected async implementation(
    req: ValidatedRequest<typeof requestSchema>,
    res: Response
  ): Promise<any> {
    const {
      params: { id },
      headers: { 'api-key': apiKey },
    } = req
    await validateApiKey({ apiKey, namespace: 'admin' })
    // Assumption: subscription is currently on its first order
    const subscription = await getSubscriptionAdmin({ id })
    const order = await getOrderAdmin({ orderId: subscription.orderId })

    await sendSubscriptionPaymentFailedEmailToCustomer({
      order: order,
      subscription: subscription,
      sendTo: subscription.customerEmail,
      emailHeader:
        'Maksukortin veloitus epäonnistui | Failed to charge your payment card | Debiteringen av betalkortet misslyckades',
    })

    return this.success(res, {})
  }
}
