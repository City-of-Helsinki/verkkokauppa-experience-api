import { AbstractController, Data, ValidatedRequest } from '@verkkokauppa/core'
import type { Response } from 'express'
import { getPaymentForOrder } from '@verkkokauppa/payment-backend'
import { getOrder } from '@verkkokauppa/order-backend'
import * as yup from 'yup'

const requestSchema = yup.object().shape({
  params: yup.object().shape({
    orderId: yup.string().required(),
  }),
})

export class GetPaymentController extends AbstractController<
  typeof requestSchema
> {
  protected readonly requestSchema = requestSchema
  protected async implementation(
    request: ValidatedRequest<typeof requestSchema>,
    result: Response
  ): Promise<any> {
    const {
      params: { orderId },
    } = request

    const order = await getOrder({ orderId })
    const dto = new Data(await getPaymentForOrder(order))

    return this.success<any>(result, dto.serialize())
  }
}
