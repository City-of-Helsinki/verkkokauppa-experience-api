import { AbstractController, Data, logger } from '@verkkokauppa/core'
import type { Request, Response } from 'express'
import { getProduct } from '@verkkokauppa/product-backend'
import { getPrice } from '@verkkokauppa/price-backend'
import { getOrder } from '@verkkokauppa/order-backend'

export class GetController extends AbstractController {
  protected async implementation(req: Request, res: Response): Promise<any> {
    const { orderId } = req.params
    if (orderId === undefined) {
      return this.clientError(res, 'Order ID not specified')
    }
    const dto = new Data()

    logger.debug(`Fetch order ${orderId}`)

    try {
      const result = await getOrder({ orderId })
      const items =
        result.items && result.items.length > 0
          ? await Promise.all(
              result.items.map(async (item) => {
                const product = await getProduct(item)
                const price = await getPrice(item)
                return {
                  ...item,
                  productName: product.name,
                  rowPriceNet:
                    parseFloat(price.original.netValue) * item.quantity,
                  rowPriceVat:
                    parseFloat(price.original.vatValue) * item.quantity,
                  rowPriceTotal:
                    parseFloat(price.original.grossValue) * item.quantity,
                }
              })
            )
          : []
      dto.data = {
        ...result,
        items,
      }
    } catch (error) {
      logger.error(error)
      if (error.response.status === 404) {
        return this.notFound(res, `Order ${orderId} not found`)
      }
      if (error.response.status === 400) {
        return this.clientError(res, 'Invalid request')
      }
      return this.fail(res, error.toString())
    }
    return this.success<any>(res, dto.serialize())
  }
}
