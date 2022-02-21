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
  createSubscriptionTermsOfServiceBinary,
} from '@verkkokauppa/message-backend'
import { getSubscriptionAdmin } from '@verkkokauppa/order-backend'
import { getPaymentForOrder } from '@verkkokauppa/payment-backend'
import {
  getMerchantDetailsForOrder,
  getSubscriptionTermsOfServiceBinary,
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
    await validateAdminApiKey({ apiKey })
    // Assumption: subscription is currently on its first order
    const subscription = await getSubscriptionAdmin({ id })
    const [payment, merchant, merchantTosPdf] = await Promise.all([
      getPaymentForOrder(subscription),
      getMerchantDetailsForOrder(subscription),
      getSubscriptionTermsOfServiceBinary(subscription),
    ])

    const subscriptionContractPdf = await createSubscriptionContractBinary({
      ...subscription,
      merchantName: merchant.merchantName,
      firstPaymentDate: parseTimestamp(payment.timestamp).toISOString(),
      secondPaymentDate: subscription.renewalDate,
    })

    const tosPdf = createSubscriptionTermsOfServiceBinary()

    const { template: body } = await createEmailTemplate({
      fileName: 'subscriptionContract',
      templateParams: { subscription, merchant },
    })

    await sendEmail({
      id: subscription.subscriptionId,
      receiver: subscription.customerEmail,
      header: 'Tilaussopimus',
      body,
      attachments: {
        'tilaussopimus.pdf': subscriptionContractPdf,
        'asiointipalvelun-ehdot.pdf': merchantTosPdf,
        'yleiset-ehdot.pdf': tosPdf,
      },
      emailType: 'subscriptionContract',
    })

    return this.success(res, {})
  }
}
