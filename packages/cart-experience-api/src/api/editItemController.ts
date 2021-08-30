import {
  AbstractController,
  Data,
  logger,
  ValidatedRequest,
} from '@verkkokauppa/core'
import type { Response } from 'express'
import { editItemInCart, removeItemFromCart } from '@verkkokauppa/cart-backend'
import * as yup from 'yup'

const requestSchema = yup.object().shape({
  body: yup.object().shape({
    quantity: yup.number().required(),
  }),
  params: yup.object().shape({
    cartId: yup.string().required(),
    productId: yup.string().required(),
  }),
})

export class EditItemController extends AbstractController<
  typeof requestSchema
> {
  protected readonly requestSchema = requestSchema

  protected async implementation(
    req: ValidatedRequest<typeof requestSchema>,
    res: Response
  ): Promise<any> {
    const {
      params: { cartId, productId },
      body: { quantity },
    } = req
    const dto = new Data()

    logger.debug(
      `Edit product ${productId} with quantity ${quantity} to cart ${cartId}`
    )

    if (quantity === 0) {
      dto.data = await removeItemFromCart({
        productId,
        cartId,
      })
    } else {
      dto.data = await editItemInCart({
        productId,
        cartId,
        quantity,
      })
    }

    return this.success<any>(res, dto.serialize())
  }
}
