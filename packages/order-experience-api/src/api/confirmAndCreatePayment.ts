import { AbstractController, Data, ValidatedRequest } from '@verkkokauppa/core'
import type { Response } from 'express'
import { confirmOrder } from '@verkkokauppa/order-backend'
import {
  createPaymentFromOrder,
  getPaymentMethodList,
  getPaymentUrl,
} from '@verkkokauppa/payment-backend'
import * as yup from 'yup'
import { calculateTotalsFromItems } from '../lib/totals'

const requestSchema = yup.object().shape({
  params: yup.object().shape({
    orderId: yup.string().required(),
  }),
  body: yup.object().shape({
    paymentMethod: yup.string().required(),
    language: yup.string().required(),
  }),
})

export class ConfirmAndCreatePayment extends AbstractController<
  typeof requestSchema
> {
  protected readonly requestSchema = requestSchema

  protected async implementation(
    req: ValidatedRequest<typeof requestSchema>,
    res: Response
  ): Promise<any> {
    const {
      params: { orderId },
      body: { paymentMethod, language },
    } = req

    const order = await confirmOrder({ orderId })
    const orderTotals = calculateTotalsFromItems(order)
    const availablePaymentMethods = await getPaymentMethodList({
      request: {
        namespace: order.namespace,
        totalPrice: parseFloat(orderTotals.priceTotal),
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

    return this.created(
      res,
      new Data({ ...order, payment: { ...payment, paymentUrl } }).serialize()
    )
  }
}
