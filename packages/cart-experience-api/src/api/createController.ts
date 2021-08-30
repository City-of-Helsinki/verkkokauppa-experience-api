import { AbstractController, Data, logger } from '@verkkokauppa/core'
import type { Request, Response } from 'express'
import { createCart, createCartWithItems } from '@verkkokauppa/cart-backend'

export class CreateController extends AbstractController {
  protected readonly requestSchema = null

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
    logger.debug(
      `Create Cart with Items for namespace ${namespace} and user ${user}`
    )
    const dto = new Data(await createCartWithItems({ namespace, user, items }))
    return this.created<any>(res, dto.serialize())
  }

  protected async create(req: Request, res: Response): Promise<any> {
    const { namespace, user } = req.body
    logger.debug(`Create Cart for namespace ${namespace} and user ${user}`)
    const dto = new Data(await createCart({ namespace, user }))
    return this.created<any>(res, dto.serialize())
  }
}
