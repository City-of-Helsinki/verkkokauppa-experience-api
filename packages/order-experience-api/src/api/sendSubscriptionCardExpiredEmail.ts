import { AbstractController, ValidatedRequest } from '@verkkokauppa/core'
import * as yup from 'yup'
import type { Response } from 'express'
import { sendSubscriptionCardExpiredEmailToCustomer } from '@verkkokauppa/message-backend'
import {
  createCardExpiredEmailEntityAdmin,
  getOrderAdmin,
  getSubscriptionAdmin,
} from '@verkkokauppa/order-backend'
import {
  getMerchantDetailsForOrder,
  validateAdminApiKey,
} from '@verkkokauppa/configuration-backend'

const requestSchema = yup.object().shape({
  params: yup.object().shape({
    id: yup.string().required(),
  }),
  headers: yup.object().shape({
    'api-key': yup.string().required(),
  }),
})

export class SendSubscriptionCardExpiredEmail extends AbstractController<
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

    // Assumption: subscription is currently on its first order
    const subscription = await getSubscriptionAdmin({ id })
    const order = await getOrderAdmin({ orderId: subscription.orderId })

    const merchant = await getMerchantDetailsForOrder(order)

    const orderWithMerchantInfo = {
      ...order,
      merchant,
    }

    await sendSubscriptionCardExpiredEmailToCustomer({
      order: orderWithMerchantInfo,
      subscription: { createdAt: new Date().toISOString(), ...subscription },
      sendTo: subscription.customerEmail,
      emailHeader:
        'Maksukorttisi vanhenee pian | Your payment card will expire soon | Giltighetstiden för ditt betalkort upphör snart',
    })
    const data = await createCardExpiredEmailEntityAdmin({
      subscriptionId: subscription.subscriptionId,
      namespace: order.namespace,
    })
    return this.success(res, data)
  }
}
