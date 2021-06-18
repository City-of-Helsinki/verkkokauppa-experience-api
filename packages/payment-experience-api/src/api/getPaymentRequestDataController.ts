import { AbstractController, Data } from '@verkkokauppa/core'
import type { Request, Response } from 'express'
import { getOrder } from '@verkkokauppa/order-backend'
import { getProduct } from "@verkkokauppa/product-backend"
import { getPrice } from "@verkkokauppa/price-backend"

export class GetPaymentRequestDataController extends AbstractController {
  protected async implementation(req: Request, res: Response): Promise<any> {
    const { orderId } = req.params
    if (orderId === undefined) {
      return this.clientError(res, 'Order ID not specified')
    }

    const dto = new Data()

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

      // TODO: mistä saadaan käyttäjän tiedot kuten namespace yms?
      // TODO: kasaa näistä olio joka lähetetään postina getin sijaan

      // TODO: elä oikeestaan tässä lähetä vaan tee oma backend tälle paskalle
      // TODO: lähetä joku perkeleen request => nimi? sisältö?

    } catch (error) {
      /*logger.error(error)
      if (error.response.status === 404) {
        return this.notFound(res, `Order ${orderId} not found`)
      }
      if (error.response.status === 400) {
        return this.clientError(res, 'Invalid request')
      }
      return this.fail(res, error.toString())*/
      // TODO!
    }
    return this.success<any>(res, dto.serialize())
  }
}
