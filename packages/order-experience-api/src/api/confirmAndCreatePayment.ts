import { AbstractController, Data } from '@verkkokauppa/core'
import type { Request, Response } from 'express'
import { confirmOrder } from '@verkkokauppa/order-backend'
import {
  createPaymentFromOrder,
  getPaymentUrl,
} from '@verkkokauppa/payment-backend'
import * as yup from 'yup'

export class ConfirmAndCreatePayment extends AbstractController {
  private static readonly reqSchema = yup.object().shape({
    params: yup.object().shape({
      orderId: yup.string().required(),
    }),
    body: yup.object().shape({
      paymentMethod: yup.string().required(),
      paymentLanguage: yup.string().required(),
    }),
  })

  protected async implementation(req: Request, res: Response): Promise<any> {
    try {
      const {
        params: { orderId },
        body: { paymentMethod, paymentLanguage },
      } = ConfirmAndCreatePayment.reqSchema.validateSync(req, {
        abortEarly: false,
      })

      const order = await confirmOrder({ orderId })

      const payment = await createPaymentFromOrder({
        order,
        paymentMethod,
        language: paymentLanguage,
      })

      const paymentUrl = await getPaymentUrl(order)

      return this.created(res, new Data({ ...payment, paymentUrl }).serialize())
    } catch (e) {
      if (e instanceof yup.ValidationError) {
        return this.clientError(res, 'Invalid request data')
      }
      throw e
    }
  }
}
