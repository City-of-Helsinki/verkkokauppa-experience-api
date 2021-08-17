import { AbstractController, Data } from '@verkkokauppa/core'
import type { Request, Response } from 'express'
import * as yup from 'yup'
import {
  addItemsToOrder,
  createOrder,
  setOrderTotals,
} from '@verkkokauppa/order-backend'
import { getProduct } from '@verkkokauppa/product-backend'
import { getPrice } from '@verkkokauppa/price-backend'
import { calculateTotalsFromItems } from '../lib/totals'

export class InstantPurchase extends AbstractController {
  private static readonly bodySchema = yup.object().shape({
    products: yup
      .array()
      .of(
        yup.object().shape({
          productId: yup.string().required(),
          quantity: yup.number().required(),
          unit: yup.string().required(),
        })
      )
      .min(1)
      .required(),
    language: yup
      .string()
      .matches(/(en|fi|sv)/)
      .required(),
    namespace: yup.string().required(),
    user: yup.string().required(),
  })

  protected async implementation(req: Request, res: Response): Promise<any> {
    try {
      const body = InstantPurchase.bodySchema.validateSync(req.body, {
        abortEarly: false,
      })

      const orderItems = await Promise.all(
        body.products.map(async ({ productId, quantity, unit }) => {
          // TODO: handle missing product / price (404)
          const [product, price] = await Promise.all([
            getProduct({ productId }),
            getPrice({ productId }),
          ])

          return {
            productId,
            quantity,
            unit,
            productName: product.name,
            rowPriceNet: (
              parseFloat(price.original.netValue) * quantity
            ).toString(),
            rowPriceVat: (
              parseFloat(price.original.vatValue) * quantity
            ).toString(),
            rowPriceTotal: (
              parseFloat(price.original.grossValue) * quantity
            ).toString(),
            priceNet: price.original.netValue,
            priceGross: price.original.grossValue,
            priceVat: price.original.vatValue,
            vatPercentage: price.original.vatPercentage,
          }
        })
      )

      const { orderId } = await createOrder({
        namespace: body.namespace,
        user: body.user,
      })

      await addItemsToOrder({
        orderId,
        items: orderItems,
      })

      const order = await setOrderTotals({
        orderId,
        ...calculateTotalsFromItems({ items: orderItems }),
      })

      return this.created(res, new Data(order).serialize())
    } catch (e) {
      if (e instanceof yup.ValidationError) {
        // TODO: return the validation errors?
        return this.clientError(res, 'Invalid request body')
      }
      throw e
    }
  }
}
