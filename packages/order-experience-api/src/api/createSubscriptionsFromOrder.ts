import { AbstractController, Data } from '@verkkokauppa/core'
import type { Request, Response } from 'express'
import { createSubscriptionsFromOrder } from '@verkkokauppa/order-backend'

export class createSubscriptionsFromOrderController extends AbstractController {
  protected readonly requestSchema = null

  protected async implementation(req: Request, res: Response): Promise<any> {
    return this.create(req, res)
  }

  protected async create(req: Request, res: Response): Promise<any> {
    const dto = new Data(await createSubscriptionsFromOrder(req.body))

    return this.created<any>(res, dto.serialize())
  }
}
