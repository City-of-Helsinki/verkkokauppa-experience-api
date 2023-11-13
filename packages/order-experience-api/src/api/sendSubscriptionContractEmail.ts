import {
  AbstractController,
  parseTimestamp,
  ValidatedRequest,
} from '@verkkokauppa/core'
import * as yup from 'yup'
import type { Response } from 'express'
import {
  createEmailTemplate,
  createSubscriptionContractBinary,
  createSubscriptionTermsOfServiceBinary,
  sendEmail,
} from '@verkkokauppa/message-backend'
import { getSubscriptionAdmin } from '@verkkokauppa/order-backend'
import { getPaymentForOrder } from '@verkkokauppa/payment-backend'
import {
  downloadMerchantTermsOfServiceBinary,
  getMerchantDetailsWithNamespaceAndMerchantId,
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

    const [payment, merchant] = await Promise.all([
      getPaymentForOrder(subscription),
      getMerchantDetailsWithNamespaceAndMerchantId(
        subscription.namespace,
        subscription?.merchantId || ''
      ),
    ])

    const [subscriptionContractPdf, merchantTosPdf] = await Promise.all([
      createSubscriptionContractBinary({
        ...subscription,
        merchantName: merchant.merchantName,
        firstPaymentDate: parseTimestamp(payment.timestamp).toISOString(),
        secondPaymentDate: subscription.renewalDate,
      }),
      downloadMerchantTermsOfServiceBinary(merchant),
    ])

    const tosPdf = createSubscriptionTermsOfServiceBinary()

    const { template: body } = await createEmailTemplate({
      fileName: 'subscriptionContract',
      templateParams: {
        subscription: { createdAt: new Date().toISOString(), ...subscription },
        merchant,
      },
    })

    await sendEmail({
      id: subscription.subscriptionId,
      receiver: subscription.customerEmail,
      header: `Tilaussopimus: ${subscription.productName} / Subscription agreement: ${subscription.productName} / Beställningsavtal: ${subscription.productName}`,
      body,
      attachments: {
        'tilaussopimus.pdf': subscriptionContractPdf as string,
        'asiointipalvelun-ehdot.pdf': merchantTosPdf,
        'yleiset-ehdot.pdf': tosPdf,
      },
      emailType: 'subscriptionContract',
    })

    return this.success(res, {})
  }
}
