import { AbstractController, Data, ValidatedRequest } from '@verkkokauppa/core'
import type { Response } from 'express'
import { getOrder, OrderItemRequest } from '@verkkokauppa/order-backend'
import {
  createPaymentFromOrder,
  getPaymentMethodList,
  getPaymentUrl,
} from '@verkkokauppa/payment-backend'
import { DEFAULT_LANGUAGE } from '../constants'
import * as yup from 'yup'

const requestSchema = yup.object().shape({
  body: yup.object().shape({
    paymentMethod: yup.string().default(''),
    language: yup.string().default(DEFAULT_LANGUAGE),
  }),
  params: yup.object().shape({
    orderId: yup.string().required(),
    user: yup.string().required(),
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
      body: { paymentMethod, language },
      params: { orderId, user },
    } = request

    const order = await getOrder({ orderId, user })
    const orderTotal = this.calculateOrderTotal(order)
    const availablePaymentMethods = await getPaymentMethodList({
      request: {
        namespace: order.namespace,
        totalPrice: orderTotal,
      },
    })
    const currentPaymentMethod = availablePaymentMethods.find(
      (availableMethod) => availableMethod.code === paymentMethod
    )
    const payment = await createPaymentFromOrder({
      order,
      paymentMethod,
      paymentMethodLabel: currentPaymentMethod?.name || paymentMethod,
      language,
    })
    const paymentUrl = await getPaymentUrl(order)
    const dto = new Data({ ...payment, paymentUrl })

    return this.created<any>(result, dto.serialize())
  }

  protected calculateOrderTotal(p: { items: OrderItemRequest[] }): number {
    const { items } = p
    let priceTotal = 0
    for (const item of items) {
      priceTotal += parseFloat(item.rowPriceTotal)
    }
    return priceTotal
  }
}
