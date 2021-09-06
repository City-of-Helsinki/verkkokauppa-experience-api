import { AbstractController, Data, ValidatedRequest } from '@verkkokauppa/core'
import type { Response } from 'express'
import { getPaymentForOrderAndValidateUser } from '@verkkokauppa/payment-backend'
import { getOrder } from '@verkkokauppa/order-backend'
import * as yup from 'yup'

const requestSchema = yup.object().shape({
  params: yup.object().shape({
    orderId: yup.string().required(),
    user: yup.string().required(),
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
      params: { orderId, user },
    } = request

    const order = await getOrder({ orderId, user })
    const dto = new Data(
      await getPaymentForOrderAndValidateUser({ ...order, user })
    )

    return this.success<any>(result, dto.serialize())
  }
}
