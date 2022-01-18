import {
  AbstractController,
  ValidatedRequest,
  parseTimestamp,
} from '@verkkokauppa/core'
import * as yup from 'yup'
import type { Response } from 'express'
import {
  createEmailTemplate,
  createSubscriptionContractBinary,
  sendEmail,
} from '@verkkokauppa/message-backend'
import { getSubscriptionAdmin } from '@verkkokauppa/order-backend'
import { getPaymentForOrder } from '@verkkokauppa/payment-backend'
import {
  getMerchantDetailsForOrder,
  validateApiKey,
} from '@verkkokauppa/configuration-backend'

const requestSchema = yup.object().shape({
  params: yup.object().shape({
    id: yup.string().required(),
  }),
  headers: yup.object().shape({
    'api-key': yup.string().required(),
  }),
})

export class SendSubscriptionContractEmail extends AbstractController<
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
    const [payment, merchant] = await Promise.all([
      getPaymentForOrder(subscription),
      getMerchantDetailsForOrder(subscription),
    ])

    const subscriptionContractPdf = await createSubscriptionContractBinary({
      ...subscription,
      merchantName: merchant.merchantName,
      firstPaymentDate: parseTimestamp(payment.timestamp).toISOString(),
      secondPaymentDate: subscription.renewalDate,
    })

    const { template: body } = await createEmailTemplate({
      fileName: 'subscriptionContract',
      templateParams: {},
    })

    await sendEmail({
      id: subscription.subscriptionId,
      receiver: subscription.customerEmail,
      header: 'Tilaussopimus',
      body,
      attachments: { 'tilaussopimus.pdf': subscriptionContractPdf },
    })

    return this.success(res, {})
  }
}
