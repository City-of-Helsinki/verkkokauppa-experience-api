import * as yup from 'yup'
import type { Response } from 'express'
import { AbstractController, ValidatedRequest } from '@verkkokauppa/core'
import {
  getMerchantDetailsWithNamespaceAndMerchantId,
  validateAdminApiKey,
} from '@verkkokauppa/configuration-backend'
import { getOrderAdmin, getRefundAdmin } from '@verkkokauppa/order-backend'
import {
  createEmailTemplate,
  parseItemMetaVisibilityAndOrdinal,
  sendEmail,
} from '@verkkokauppa/message-backend'
import { getRefundPaymentForOrderAdmin } from '@verkkokauppa/payment-backend'

const requestSchema = yup.object().shape({
  params: yup.object().shape({
    refundId: yup.string().required(),
  }),
  headers: yup.object().shape({
    'api-key': yup.string().required(),
  }),
})

export class SendRefundEmailController extends AbstractController<
  typeof requestSchema
> {
  protected readonly requestSchema = requestSchema

  protected async implementation(
    req: ValidatedRequest<typeof requestSchema>,
    res: Response
  ): Promise<any> {
    const {
      params: { refundId },
      headers: { 'api-key': apiKey },
    } = req
    await validateAdminApiKey({ apiKey })

    const refund = await getRefundAdmin({ refundId })
    const order = await getOrderAdmin({ orderId: refund.refund.orderId })
    const merchant = await getMerchantDetailsWithNamespaceAndMerchantId(
      refund.refund.namespace,
      refund.items[0]?.merchantId || ''
    )
    const payment = await getRefundPaymentForOrderAdmin({
      orderId: order.orderId,
    })

    const vatTable = refund.items.reduce((table, item) => {
      if (!table[item.vatPercentage]) {
        table[item.vatPercentage] = 0
      }
      table[item.vatPercentage] += +item.rowPriceVat || 0
      return table
    }, {} as { [key: string]: number })

    const { template: email } = await createEmailTemplate({
      fileName: 'refundConfirmation',
      templateParams: {
        refund: {
          ...refund,
          items: refund.items.map((item) => ({
            ...item,
            meta: parseItemMetaVisibilityAndOrdinal(
              order.items.find((i) => i.orderItemId === item.orderItemId)?.meta
            ),
          })),
        },
        order,
        merchant,
        payment,
        vatTable,
      },
    })

    await sendEmail({
      id: refund.refund.refundId,
      receiver: order.customer?.email!,
      header: 'Vahvistus ja kuitti maksun palautuksesta',
      body: email,
      attachments: {},
      emailType: 'refundConfirmation',
    })

    return this.success(res)
  }
}
