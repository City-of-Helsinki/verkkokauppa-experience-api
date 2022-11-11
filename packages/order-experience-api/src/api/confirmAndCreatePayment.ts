import { AbstractController, Data, ValidatedRequest } from '@verkkokauppa/core'
import type { Response } from 'express'
import {
  checkLastValidPurchaseDateTime,
  confirmOrder,
} from '@verkkokauppa/order-backend'
import {
  createPaymentFromUnpaidOrder,
  getPaymentMethodList,
  getPaymentUrl,
} from '@verkkokauppa/payment-backend'
import * as yup from 'yup'
import { calculateTotalsFromItems } from '../lib/totals'
import { parseMerchantIdFromFirstOrderItem } from '@verkkokauppa/configuration-backend'

const requestSchema = yup.object().shape({
  params: yup.object().shape({
    orderId: yup.string().required(),
  }),
  body: yup.object().shape({
    paymentMethod: yup.string().required(),
    language: yup.string().required(),
  }),
  headers: yup.object().shape({
    user: yup.string().required(),
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
      headers: { user },
    } = req

    const order = await confirmOrder({ orderId, user })
    checkLastValidPurchaseDateTime(order.lastValidPurchaseDateTime)
    const orderTotals = calculateTotalsFromItems(order)
    const merchantId = parseMerchantIdFromFirstOrderItem(order)

    const availablePaymentMethods = await getPaymentMethodList({
      order,
      namespace: order.namespace,
      totalPrice: parseFloat(orderTotals.priceTotal),
      merchantId,
    })
    const currentPaymentMethod = availablePaymentMethods.find(
      (availableMethod) => availableMethod.code === paymentMethod
    )
    const payment = await createPaymentFromUnpaidOrder({
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
