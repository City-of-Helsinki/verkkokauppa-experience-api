import {
  AbstractController,
  Data,
  logger,
  ValidatedRequest,
} from '@verkkokauppa/core'
import type { Response } from 'express'
import * as yup from 'yup'
import {
  addItemsToOrder,
  createOrder,
  getOrder,
  setOrderTotals,
} from '@verkkokauppa/order-backend'
import { getProduct } from '@verkkokauppa/product-backend'
import { getPrice } from '@verkkokauppa/price-backend'
import { calculateTotalsFromItems } from '../lib/totals'
import {
  getMerchantDetailsForOrder,
  getMerchantModels,
} from '@verkkokauppa/configuration-backend'
import { getProductMapping } from '@verkkokauppa/product-mapping-backend'

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

        const merchants = await getMerchantModels(body.namespace)

        let merchantId = ''

        // Only one merchant found for namespace, we can use that merchant id
        if (merchants && merchants.length === 1 && merchants[0]?.merchantId) {
          merchantId = merchants[0]?.merchantId
          logger.info(
            'Using merchantId with namespace, only one merchant found'
          )
        }

        // More than one merchant found, we need to get merchantId from product accounting
        if (merchants && merchants.length > 1) {
          try {
            const productMapping = await getProductMapping({ productId })
            merchantId = productMapping.merchantId
          } catch (e) {
            logger.info('Error when fetching product mapping', e)
          }
        }

        return {
          productId,
          merchantId,
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

    const fetchOrder = await getOrder({ orderId, user: body.user })

    const merchant = await getMerchantDetailsForOrder({
      namespace: body.namespace,
      items: fetchOrder?.items || [],
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
