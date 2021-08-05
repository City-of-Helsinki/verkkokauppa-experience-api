import { AbstractController, Data, logger } from '@verkkokauppa/core'
import type { Request, Response } from 'express'
import { getOrder, setOrderTotals } from '@verkkokauppa/order-backend'
import { calculateTotalsFromItems } from '../lib/totals'

export class CalculateTotalsController extends AbstractController {
  protected async implementation(req: Request, res: Response): Promise<any> {
    const { orderId } = req.params
    const dto = new Data()
    logger.debug(`Calculate totals for Order ${orderId}`)

    if (orderId === undefined) {
      return this.clientError(res, 'Order ID not specified')
    }

    const order = await getOrder({ orderId })

    if (order.items === undefined) {
      return this.clientError(res, 'No items specified for order')
    }

    try {
      dto.data = await setOrderTotals({
        orderId,
        ...calculateTotalsFromItems(order),
      })
    } catch (error) {
      logger.error(error)
      if (error.response.status === 400) {
        return this.clientError(res, 'Invalid request')
      }
      return this.fail(res, error.toString())
    }
    return this.success<any>(res, dto.serialize())
  }
}
