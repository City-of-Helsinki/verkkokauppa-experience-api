import {
  AbstractController,
  Data,
  logger,
  ValidatedRequest,
} from '@verkkokauppa/core'
import type { Response } from 'express'
import { setCustomerToOrder } from '@verkkokauppa/order-backend'
import { customerSchema } from '../lib/validation'
import * as yup from 'yup'

const requestSchema = yup.object().shape({
  body: yup.object().shape({
    customer: customerSchema.required(),
  }),
  params: yup.object().shape({
    orderId: yup.string().required(),
  }),
  headers: yup.object().shape({
    user: yup.string().required(),
  }),
})

export class SetCustomerController extends AbstractController<
  typeof requestSchema
> {
  protected readonly requestSchema = requestSchema

  protected async implementation(
    req: ValidatedRequest<typeof requestSchema>,
    res: Response
  ): Promise<any> {
    const {
      params: { orderId },
      body: { customer },
      headers: { user },
    } = req

    logger.debug(
      `Setting Customer with name: ${customer.firstName} ${customer.lastName}, email ${customer.email} and phone ${customer.phone} to order ${orderId}`
    )

    const dto = new Data(
      await setCustomerToOrder({
        orderId,
        user,
        customer,
      })
    )

    return this.success<any>(res, dto.serialize())
  }
}
