import { AbstractController, Data, logger } from '@verkkokauppa/core'
import type { Request, Response } from 'express'
import { getOrder } from '@verkkokauppa/order-backend'
import { getMerchantDetailsForOrder } from '@verkkokauppa/configuration-backend'
import { transformConfigurationToMerchant } from '../lib/merchant'

export class GetController extends AbstractController {
  protected async implementation(req: Request, res: Response): Promise<any> {
    const { orderId } = req.params
    if (orderId === undefined) {
      return this.clientError(res, 'Order ID not specified')
    }
    const dto = new Data()

    logger.debug(`Fetch order ${orderId}`)

    try {
      const order = await getOrder({ orderId })
      const merchantConfiguration = await getMerchantDetailsForOrder(order)

      dto.data = {
        ...order,
        merchant: transformConfigurationToMerchant(merchantConfiguration),
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
