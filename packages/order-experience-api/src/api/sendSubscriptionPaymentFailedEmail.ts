import {
  AbstractController,
  logger,
  ValidatedRequest,
} from '@verkkokauppa/core'
import * as yup from 'yup'
import type { Response } from 'express'
import { sendSubscriptionPaymentFailedEmailToCustomer } from '@verkkokauppa/message-backend'
import {
  getActiveOrderAdmin,
  getSubscriptionAdmin,
  incrementValidationFailedEmailSentCountAdmin,
} from '@verkkokauppa/order-backend'
import { validateAdminApiKey } from '@verkkokauppa/configuration-backend'

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
    await validateAdminApiKey({ apiKey })
    logger.debug(`Sending renewal payment failed email for subscription ${id}`)

    // Assumption: subscription is currently on its first order
    const subscription = await getSubscriptionAdmin({ id })
    const order = await getActiveOrderAdmin({
      subscriptionId: subscription.subscriptionId,
      endDate: subscription.endDate,
    })
    logger.debug(`Getting metas from order ${order?.orderId}`)

    await sendSubscriptionPaymentFailedEmailToCustomer({
      order: order,
      subscription: { createdAt: new Date().toISOString(), ...subscription },
      sendTo: subscription.customerEmail,
      emailHeader:
        'Maksukortin veloitus epäonnistui | Failed to charge your payment card | Debiteringen av betalkortet misslyckades',
    })
    const data = await incrementValidationFailedEmailSentCountAdmin({
      subscriptionId: subscription.subscriptionId,
    })
    return this.success(res, { count: data })
  }
}
