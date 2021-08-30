import {
  AbstractController,
  Data,
  logger,
  ValidatedRequest,
} from '@verkkokauppa/core'
import type { Response } from 'express'
import { getCart } from '@verkkokauppa/cart-backend'
import { getProduct } from '@verkkokauppa/product-backend'
import { getPrice } from '@verkkokauppa/price-backend'
import * as yup from 'yup'

const requestSchema = yup.object().shape({
  params: yup.object().shape({
    cartId: yup.string().required(),
  }),
})

export class GetController extends AbstractController<typeof requestSchema> {
  protected readonly requestSchema = requestSchema

  protected async implementation(
    req: ValidatedRequest<typeof requestSchema>,
    res: Response
  ): Promise<any> {
    const {
      params: { cartId },
    } = req

    logger.debug(`Fetch cart ${cartId}`)

    const result = await getCart({ cartId })
    const items =
      result.items && result.items.length > 0
        ? await Promise.all(
            result.items.map(async (item) => {
              const product = await getProduct(item)
              const productPrice = await getPrice(item)
              return {
                ...item,
                name: product.name,
                price: parseFloat(productPrice.price),
              }
            })
          )
        : []

    const dto = new Data({
      ...result,
      items,
    })

    return this.success<any>(res, dto.serialize())
  }
}
