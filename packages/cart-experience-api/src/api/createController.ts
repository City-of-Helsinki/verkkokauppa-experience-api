import { AbstractController, Data, logger } from '@verkkokauppa/core'
import type { Request, Response } from 'express'
import { createCart, createCartWithItems } from '@verkkokauppa/cart-backend'

export class CreateController extends AbstractController {
  protected async implementation(req: Request, res: Response): Promise<any> {
    const { items } = req.body

    if (items && items.length > 0) {
      return this.createWithItems(req, res)
    } else {
      return this.create(req, res)
    }
  }

  protected async createWithItems(req: Request, res: Response): Promise<any> {
    const { namespace, user, items } = req.body
    const dto = new Data()
    logger.debug(
      `Create Cart with Items for namespace ${namespace} and user ${user}`
    )
    try {
      dto.data = await createCartWithItems({ namespace, user, items })
    } catch (error) {
      logger.error(error)
      if (error.response.status === 400) {
        return this.clientError(res, 'Invalid request')
      }
      return this.fail(res, error.toString())
    }
    return this.created<any>(res, dto.serialize())
  }

  protected async create(req: Request, res: Response): Promise<any> {
    const { namespace, user } = req.body
    const dto = new Data()
    logger.debug(`Create Cart for namespace ${namespace} and user ${user}`)

    try {
      dto.data = await createCart({ namespace, user })
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
