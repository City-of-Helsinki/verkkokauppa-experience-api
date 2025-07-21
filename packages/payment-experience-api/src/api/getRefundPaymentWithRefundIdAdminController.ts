import { AbstractController, ValidatedRequest } from '@verkkokauppa/core'
import type { Response } from 'express'
import { getRefundPaymentForOrderAdminByRefundId } from '@verkkokauppa/payment-backend'
import * as yup from 'yup'
import { validateApiKey } from '@verkkokauppa/configuration-backend'

const requestSchema = yup.object().shape({
  params: yup.object().shape({
    refundId: yup.string().required(),
  }),
  headers: yup.object().shape({
    'api-key': yup.string().required(),
    namespace: yup.string().required(),
  }),
})

export class GetRefundPaymentWithRefundIdAdminController extends AbstractController<
  typeof requestSchema
> {
  protected readonly requestSchema = requestSchema
  protected async implementation(
    request: ValidatedRequest<typeof requestSchema>,
    result: Response
  ): Promise<any> {
    const {
      params: { refundId },
      headers: { 'api-key': apiKey, namespace },
    } = request

    await validateApiKey({ namespace, apiKey })

    const refundPayments = await getRefundPaymentForOrderAdminByRefundId({
      refundId,
    })

    return this.success<any>(result, refundPayments)
  }
}
