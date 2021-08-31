import { AbstractController, Data, ValidatedRequest } from '@verkkokauppa/core'
import type { Response } from 'express'
import { getOrder } from '@verkkokauppa/order-backend'
import {
  createPaymentFromOrder,
  getPaymentUrl,
} from '@verkkokauppa/payment-backend'
import { DEFAULT_LANGUAGE } from '../constants'
import * as yup from 'yup'

const requestSchema = yup.object().shape({
  body: yup.object().shape({
    paymentMethod: yup.string().default(''),
    paymentMethodLabel: yup.string().default(''),
    language: yup.string().default(DEFAULT_LANGUAGE),
  }),
  params: yup.object().shape({
    orderId: yup.string().required(),
  }),
})

export class CreatePaymentController extends AbstractController<
  typeof requestSchema
> {
  protected readonly requestSchema = requestSchema

  protected async implementation(
    request: ValidatedRequest<typeof requestSchema>,
    result: Response
  ): Promise<any> {
    const {
      body: { paymentMethod, paymentMethodLabel, language },
      params: { orderId },
    } = request

    const order = await getOrder({ orderId })
    const payment = await createPaymentFromOrder({
      order,
      paymentMethod,
      paymentMethodLabel,
      language,
    })
    const paymentUrl = await getPaymentUrl(order)
    const dto = new Data({ ...payment, paymentUrl })

    return this.created<any>(result, dto.serialize())
  }
}
