import {
  AbstractController,
  Data,
  logger,
  ValidatedRequest,
} from '@verkkokauppa/core'
import type { Response } from 'express'
import { addItemsToOrder } from '@verkkokauppa/order-backend'
import { itemsSchema } from '../lib/validation'
import * as yup from 'yup'

const requestSchema = yup.object().shape({
  body: yup.object().shape({
    items: itemsSchema.required().min(1),
  }),
  params: yup.object().shape({
    orderId: yup.string().required(),
  }),
  headers: yup.object().shape({
    user: yup.string().required(),
  }),
})

export class AddItemController extends AbstractController<
  typeof requestSchema
> {
  protected readonly requestSchema = requestSchema
  protected async implementation(
    req: ValidatedRequest<typeof requestSchema>,
    res: Response
  ): Promise<any> {
    const {
      params: { orderId },
      body: { items },
      headers: { user },
    } = req

    logger.debug(`Add items to order ${orderId}`)

    const dto = new Data(
      await addItemsToOrder({
        orderId,
        user,
        items,
      })
    )

    return this.success<any>(res, dto.serialize())
  }
}
