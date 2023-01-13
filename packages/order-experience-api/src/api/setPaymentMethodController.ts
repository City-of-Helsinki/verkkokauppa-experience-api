import * as yup from 'yup'
import { AbstractController, Data, ValidatedRequest } from '@verkkokauppa/core'
import type { Response } from 'express'
import { PaymentGateway } from '@verkkokauppa/payment-backend'
import { setOrderPaymentMethod } from '@verkkokauppa/order-backend'

const requestSchema = yup.object().shape({
  body: yup.object().shape({
    paymentMethod: yup
      .object({
        name: yup.string().required(),
        code: yup.string().required(),
        group: yup.string().required(),
        img: yup.string().required(),
        gateway: yup
          .mixed<PaymentGateway>()
          .oneOf(Object.values(PaymentGateway))
          .required(),
      })
      .noUnknown()
      .required(),
  }),
  params: yup.object().shape({
    orderId: yup.string().required(),
  }),
  headers: yup.object().shape({
    user: yup.string().required(),
  }),
})

export class SetPaymentMethodController extends AbstractController<
  typeof requestSchema
> {
  protected readonly requestSchema = requestSchema

  protected async implementation(
    req: ValidatedRequest<typeof requestSchema>,
    res: Response
  ): Promise<any> {
    const {
      params: { orderId },
      body: { paymentMethod },
      headers: { user },
    } = req
    const dto = new Data(
      await setOrderPaymentMethod({
        orderId,
        user,
        paymentMethod,
      })
    )

    return this.success(res, dto.serialize())
  }
}
