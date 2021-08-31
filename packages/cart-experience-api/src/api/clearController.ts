import {
  AbstractController,
  Data,
  logger,
  ValidatedRequest,
} from '@verkkokauppa/core'
import type { Response } from 'express'
import { clearCart, getCart } from '@verkkokauppa/cart-backend'
import * as yup from 'yup'

const requestSchema = yup.object().shape({
  params: yup.object().shape({
    cartId: yup.string().required(),
  }),
})

export class ClearController extends AbstractController<typeof requestSchema> {
  protected readonly requestSchema = requestSchema

  protected async implementation(
    req: ValidatedRequest<typeof requestSchema>,
    res: Response
  ): Promise<any> {
    const {
      params: { cartId },
    } = req

    logger.debug(`Clear cart ${cartId}`)

    const existingCart = await getCart({ cartId })
    const dto = new Data(await clearCart(existingCart))

    return this.success<any>(res, dto.serialize())
  }
}
