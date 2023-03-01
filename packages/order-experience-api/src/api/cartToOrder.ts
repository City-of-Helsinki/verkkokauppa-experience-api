import {
  AbstractController,
  Data,
  logger,
  ValidatedRequest,
} from '@verkkokauppa/core'
import type { Response } from 'express'
import {
  createOrderWithItems,
  calculateTotalsFromItems,
} from '@verkkokauppa/order-backend'
import { getCart } from '@verkkokauppa/cart-backend'
import { getPrice } from '@verkkokauppa/price-backend'
import { getProduct } from '@verkkokauppa/product-backend'
import * as yup from 'yup'
import { customerSchema } from '../lib/validation'

const requestSchema = yup.object().shape({
  body: yup.object().shape({
    customer: customerSchema.required(),
  }),
  params: yup.object().shape({
    cartId: yup.string().required(),
  }),
})

export class CartToOrder extends AbstractController<typeof requestSchema> {
  protected readonly requestSchema = requestSchema

  protected async implementation(
    req: ValidatedRequest<typeof requestSchema>,
    res: Response
  ): Promise<any> {
    return this.createFromCart(req, res)
  }

  protected async createFromCart(
    req: ValidatedRequest<typeof requestSchema>,
    res: Response
  ): Promise<any> {
    const {
      params: { cartId },
      body: { customer },
    } = req

    logger.debug(`Create Order from cart ${cartId}`)

    const cart = await getCart({ cartId })
    const items = await Promise.all(
      cart.items.map(async (cartItem) => {
        //TODO: Remove calculation logic once totals are stored in cart
        const product = await getProduct(cartItem)
        const price = await getPrice(cartItem)
        return {
          productId: cartItem.productId,
          productName: product.name,
          quantity: cartItem.quantity,
          unit: cartItem.unit,
          rowPriceNet: (
            parseFloat(price.original.netValue) * cartItem.quantity
          ).toString(),
          rowPriceVat: (
            parseFloat(price.original.vatValue) * cartItem.quantity
          ).toString(),
          rowPriceTotal: (
            parseFloat(price.original.grossValue) * cartItem.quantity
          ).toString(),
          priceNet: price.original.netValue,
          priceGross: price.original.grossValue,
          priceVat: price.original.vatValue,
          vatPercentage: price.original.vatPercentage,
        }
      })
    )

    const dto = new Data(
      await createOrderWithItems({
        namespace: cart.namespace,
        user: cart.user || '',
        customer,
        items,
        ...calculateTotalsFromItems({ items }),
      })
    )

    return this.created<any>(res, dto.serialize())
  }
}
