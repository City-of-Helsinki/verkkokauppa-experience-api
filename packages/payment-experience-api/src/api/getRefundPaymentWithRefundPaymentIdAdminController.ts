import { AbstractController, ValidatedRequest } from '@verkkokauppa/core'
import type { Response } from 'express'
import { getRefundPaymentAdminByRefundPaymentId } from '@verkkokauppa/payment-backend'
import * as yup from 'yup'
import { validateApiKey } from '@verkkokauppa/configuration-backend'

const requestSchema = yup.object().shape({
  params: yup.object().shape({
    refundPaymentId: yup.string().required(),
  }),
  headers: yup.object().shape({
    'api-key': yup.string().required(),
    namespace: yup.string().required(),
  }),
})

export class GetRefundPaymentWithRefundPaymentIdAdminController extends AbstractController<
  typeof requestSchema
> {
  protected readonly requestSchema = requestSchema
  protected async implementation(
    request: ValidatedRequest<typeof requestSchema>,
    result: Response
  ): Promise<any> {
    const {
      params: { refundPaymentId },
      headers: { 'api-key': apiKey, namespace },
    } = request

    await validateApiKey({ namespace, apiKey })

    const refundPayment = await getRefundPaymentAdminByRefundPaymentId({
      refundPaymentId,
    })

    return this.success<any>(result, refundPayment)
  }
}
