import {
  AbstractController,
  Data,
  logger,
  ValidatedRequest,
} from '@verkkokauppa/core'
import type { Response } from 'express'
import { createOrder, createOrderWithItems } from '@verkkokauppa/order-backend'
import { customerSchema, itemsSchema } from '../lib/validation'
import { calculateTotalsFromItems } from '../lib/totals'
import * as yup from 'yup'
import { RequestValidationError } from '@verkkokauppa/core/dist/errors'

const requestSchema = yup.object().shape({
  body: yup.object().shape({
    namespace: yup.string().required(),
    user: yup.string().required(),
    items: itemsSchema.optional(),
    customer: customerSchema.optional(),
  }),
})

export class CreateController extends AbstractController<typeof requestSchema> {
  protected readonly requestSchema = requestSchema

  protected async implementation(
    req: ValidatedRequest<typeof requestSchema>,
    res: Response
  ): Promise<any> {
    const { items, customer } = req.body

    if (items && items.length > 0) {
      if (customer === undefined) {
        throw new RequestValidationError('body.customer is a required field')
      }
      return this.createWithItems(req, res)
    } else {
      return this.create(req, res)
    }
  }

  protected async create(
    req: ValidatedRequest<typeof requestSchema>,
    res: Response
  ): Promise<any> {
    const { namespace, user } = req.body
    logger.debug(`Create Order for namespace ${namespace} and user ${user}`)
    const dto = new Data(await createOrder({ namespace, user }))
    return this.created<any>(res, dto.serialize())
  }

  protected async createWithItems(
    req: ValidatedRequest<typeof requestSchema>,
    res: Response
  ): Promise<any> {
    const { namespace, user, items, customer } = req.body
    logger.debug(
      `Create Order with Items for namespace ${namespace} and user ${user}`
    )
    const dto = new Data(
      await createOrderWithItems({
        namespace,
        user,
        items,
        customer,
        ...calculateTotalsFromItems({ items }),
      })
    )

    return this.created<any>(res, dto.serialize())
  }
}
