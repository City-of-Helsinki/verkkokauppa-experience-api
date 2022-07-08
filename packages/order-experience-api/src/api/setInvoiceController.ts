import {
  AbstractController,
  Data,
  logger,
  ValidatedRequest,
} from '@verkkokauppa/core'
import type { Response } from 'express'
import { setInvoiceToOrder } from '@verkkokauppa/order-backend'
import { invoiceSchema } from '../lib/validation'
import * as yup from 'yup'

const requestSchema = yup.object().shape({
  body: yup.object().shape({
    invoice: invoiceSchema.required(),
  }),
  params: yup.object().shape({
    orderId: yup.string().required(),
  }),
  headers: yup.object().shape({
    user: yup.string().required(),
  }),
})

export class SetInvoiceController extends AbstractController<
  typeof requestSchema
> {
  protected readonly requestSchema = requestSchema

  protected async implementation(
    req: ValidatedRequest<typeof requestSchema>,
    res: Response
  ): Promise<any> {
    const {
      params: { orderId },
      body: { invoice },
      headers: { user },
    } = req

    logger.debug(
      `Invoice details ` +
        JSON.stringify(invoice, null, 2) +
        ` to order ${orderId}`
    )

    const dto = new Data(
      await setInvoiceToOrder({
        orderId,
        user,
        invoice,
      })
    )

    return this.success<any>(res, dto.serialize())
  }
}
