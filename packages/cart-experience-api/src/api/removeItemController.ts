import {
  AbstractController,
  Data,
  logger,
  ValidatedRequest,
} from '@verkkokauppa/core'
import type { Response } from 'express'
import { removeItemFromCart } from '@verkkokauppa/cart-backend'
import * as yup from 'yup'

const requestSchema = yup.object().shape({
  params: yup.object().shape({
    cartId: yup.string().required(),
    productId: yup.string().required(),
  }),
})

export class RemoveItemController extends AbstractController<
  typeof requestSchema
> {
  protected readonly requestSchema = requestSchema

  protected async implementation(
    req: ValidatedRequest<typeof requestSchema>,
    res: Response
  ): Promise<any> {
    const {
      params: { cartId, productId },
    } = req

    logger.debug(`Remove product ${productId} from cart ${cartId}`)

    const dto = new Data(
      await removeItemFromCart({
        productId,
        cartId,
      })
    )

    return this.success<any>(res, dto.serialize())
  }
}
