import {AbstractController, Data, logger} from '@verkkokauppa/core'
import type {Request, Response} from 'express'
import {searchActiveRecurringOrder} from '@verkkokauppa/order-backend'

export class SearchActiveRecurringOrderController extends AbstractController {
    protected async implementation(req: Request, res: Response): Promise<any> {
        return this.create(req, res)
    }

    protected async create(req: Request, res: Response): Promise<any> {
        const dto = new Data()

        try {
            dto.data = await searchActiveRecurringOrder(req.body)
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
