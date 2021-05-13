import { AbstractController, Data, logger } from '@verkkokauppa/core'
import type { Request, Response } from 'express'
import { createOrder, createOrderWithItems } from '@verkkokauppa/order-backend'

export class CreateController extends AbstractController {
  protected async implementation(req: Request, res: Response): Promise<any> {
    const { items } = req.body

    if (items && items.length > 0) {
      return this.createWithItems(req, res)
    } else {
      return this.create(req, res)
    }
  }

  protected async create(req: Request, res: Response): Promise<any> {
    const { namespace, user } = req.body
    const dto = new Data()
    logger.debug(`Create Order for namespace ${namespace} and user ${user}`)

    try {
      dto.data = await createOrder({ namespace, user })
    } catch (error) {
      logger.error(error)
      if (error.response.status === 400) {
        return this.clientError(res, 'Invalid request')
      }
      return this.fail(res, error.toString())
    }
    return this.created<any>(res, dto.serialize())
  }

  protected async createWithItems(req: Request, res: Response): Promise<any> {
    const { namespace, user, items, customer } = req.body
    if (customer === undefined) {
      return this.clientError(res, 'Customer not specified')
    }
    if (namespace === undefined) {
      return this.clientError(res, 'Namespace not specified')
    }
    const dto = new Data()
    logger.debug(
      `Create Order with Items for namespace ${namespace} and user ${user}`
    )
    try {
      dto.data = await createOrderWithItems({
        namespace,
        user,
        items,
        customer,
      })
    } catch (error) {
      logger.error(error)
      if (error.response.status === 400) {
        return this.clientError(res, 'Invalid request')
      }
      return this.fail(res, error.toString())
    }
    return this.created<any>(res, dto.serialize())
  }
}
