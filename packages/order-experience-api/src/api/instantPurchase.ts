import { AbstractController, Data, ValidatedRequest } from '@verkkokauppa/core'
import type { Response } from 'express'
import * as yup from 'yup'
import {
  addItemsToOrder,
  createOrder,
  setOrderTotals,
} from '@verkkokauppa/order-backend'
import { getProduct } from '@verkkokauppa/product-backend'
import { getPrice } from '@verkkokauppa/price-backend'
import { calculateTotalsFromItems } from '../lib/totals'
import { getMerchantDetailsForOrder } from '@verkkokauppa/configuration-backend'

const requestSchema = yup.object().shape({
  body: yup.object().shape({
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
  }),
})

export class InstantPurchase extends AbstractController<typeof requestSchema> {
  protected readonly requestSchema = requestSchema

  protected async implementation(
    req: ValidatedRequest<typeof requestSchema>,
    res: Response
  ): Promise<any> {
    const { body } = req

    const orderItems = await Promise.all(
      body.products.map(async ({ productId, quantity, unit, meta }) => {
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
          meta,
        }
      })
    )

    const { orderId } = await createOrder({
      namespace: body.namespace,
      user: body.user,
    })

    await addItemsToOrder({
      orderId,
      user: body.user,
      items: orderItems,
    })

    const merchant = await getMerchantDetailsForOrder({
      namespace: body.namespace,
    })

    const order = await setOrderTotals({
      orderId,
      user: body.user,
      ...calculateTotalsFromItems({ items: orderItems }),
    })

    return this.created(
      res,
      new Data({
        ...order,
        merchant,
      }).serialize()
    )
  }
}
