import { AbstractController, Data, ValidatedRequest } from '@verkkokauppa/core'
import type { Response } from 'express'
import {
  getPaymentForOrderAdmin,
  PaymentStatus,
} from '@verkkokauppa/payment-backend'
import { getOrderAdmin } from '@verkkokauppa/order-backend'
import * as yup from 'yup'
import { validateAdminApiKey } from '@verkkokauppa/configuration-backend'
import { sendReceiptToCustomer } from '../lib/sendEmail'

const requestSchema = yup.object().shape({
  params: yup.object().shape({
    orderId: yup.string().required(),
  }),
  headers: yup.object().shape({
    'api-key': yup.string().required(),
  }),
})

export class SendReceiptPaymentAdminInternalController extends AbstractController<
  typeof requestSchema
> {
  protected readonly requestSchema = requestSchema
  protected async implementation(
    request: ValidatedRequest<typeof requestSchema>,
    result: Response
  ): Promise<any> {
    const {
      params: { orderId },
      headers: { 'api-key': apiKey },
    } = request

    await validateAdminApiKey({ apiKey })

    const order = await getOrderAdmin({ orderId })
    const dto = new Data(await getPaymentForOrderAdmin(order))
    // Check that status is paid_online before sending
    const vismaStatus = {
      paymentPaid: dto.serialize().status === PaymentStatus.PAID_ONLINE,
    }

    // Function contains internal checks when to send receipt.
    await sendReceiptToCustomer(vismaStatus, orderId, order)

    return this.success<any>(result, dto.serialize())
  }
}
