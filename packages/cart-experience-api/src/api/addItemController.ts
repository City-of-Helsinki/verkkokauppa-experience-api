import {
  AbstractController,
  Data,
  logger,
  ValidatedRequest,
} from '@verkkokauppa/core'
import type { Response } from 'express'
import { addItemToCart } from '@verkkokauppa/cart-backend'
import * as yup from 'yup'

const requestSchema = yup.object().shape({
  body: yup.object().shape({
    productId: yup.string().required(),
    quantity: yup.number().default(1),
  }),
  params: yup.object().shape({
    cartId: yup.string().required(),
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
      body: { productId, quantity },
      params: { cartId },
    } = req

    logger.debug(
      `Add product ${productId} with quantity ${quantity} to cart ${cartId}`
    )

    const dto = new Data(
      await addItemToCart({
        productId,
        cartId,
        quantity,
      })
    )

    return this.success<any>(res, dto.serialize())
  }
}
