import { AbstractController, Data, logger } from '@verkkokauppa/core'
import type { Request, Response } from 'express'
import { getRecurringOrder } from '@verkkokauppa/order-backend'

export class GetRecurringOrderController extends AbstractController {
  protected async implementation(req: Request, res: Response): Promise<any> {
    const { id } = req.params
    if (id === undefined) {
      return this.clientError(res, 'Recurring order ID not specified')
    }

    const dto = new Data()

    logger.debug(`Fetch recurring order ${id}`)

    try {
      const result = await getRecurringOrder({ id })
      dto.data = { ...result }
    } catch (error) {
      logger.error(error)

      if (error.response.status === 404) {
        return this.notFound(res, `Recurring order ${id} not found`)
      } else if (error.response.status != 200) {
        return this.clientError(res, 'Invalid request')
      }
      return this.fail(res, error.toString())
    }

    return this.success<any>(res, dto.serialize())
  }
}
