import { AbstractController, Data, logger } from '@verkkokauppa/core'
import type { Request, Response } from 'express'
import { createOrder} from '@verkkokauppa/order-backend'

export class CreateController extends AbstractController {
  protected async implementation(req: Request, res: Response): Promise<any> {
    return this.create(req, res)
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
}
