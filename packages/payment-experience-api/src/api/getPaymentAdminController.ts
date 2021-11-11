import { AbstractController, Data, ValidatedRequest } from '@verkkokauppa/core'
import type { Response } from 'express'
import { getPaymentForOrderAdmin } from '@verkkokauppa/payment-backend'
import { getOrderAdmin } from '@verkkokauppa/order-backend'
import * as yup from 'yup'
import { validateApiKey } from '@verkkokauppa/configuration-backend'

const requestSchema = yup.object().shape({
  params: yup.object().shape({
    orderId: yup.string().required(),
  }),
  headers: yup.object().shape({
    'api-key': yup.string().required(),
    namespace: yup.string().required(),
  }),
})

export class GetPaymentAdminController extends AbstractController<
  typeof requestSchema
> {
  protected readonly requestSchema = requestSchema
  protected async implementation(
    request: ValidatedRequest<typeof requestSchema>,
    result: Response
  ): Promise<any> {
    const {
      params: { orderId },
      headers: { 'api-key': apiKey, namespace },
    } = request

    await validateApiKey({ namespace, apiKey })

    const order = await getOrderAdmin({ orderId })
    const dto = new Data(await getPaymentForOrderAdmin(order))

    return this.success<any>(result, dto.serialize())
  }
}
