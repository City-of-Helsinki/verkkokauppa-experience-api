import {
  AbstractController,
  Data,
  logger,
  ValidatedRequest,
  RequestValidationError,
} from '@verkkokauppa/core'
import type { Response } from 'express'
import { createOrder, createOrderWithItems } from '@verkkokauppa/order-backend'
import { savePaymentFiltersAdmin } from '@verkkokauppa/payment-backend'
import {
  customerSchema,
  itemsSchema,
  paymentFiltersSchema,
} from '../lib/validation'
import { calculateTotalsFromItems } from '../lib/totals'
import * as yup from 'yup'

const requestSchema = yup.object().shape({
  body: yup.object().shape({
    namespace: yup.string().required(),
    user: yup.string().required(),
    items: itemsSchema.notRequired(),
    customer: customerSchema.notRequired().default(undefined),
    paymentFilters: paymentFiltersSchema.required(),
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
    const { namespace, user, paymentFilters } = req.body
    logger.debug(`Create Order for namespace ${namespace} and user ${user}`)
    const orderData = await createOrder({ namespace, user })
    const paymentFiltersData = await savePaymentFiltersAdmin(paymentFilters)
    const dto = new Data({
      ...orderData,
      paymentFilters: paymentFiltersData,
    })
    return this.created<any>(res, dto.serialize())
  }

  protected async createWithItems(
    req: ValidatedRequest<typeof requestSchema>,
    res: Response
  ): Promise<any> {
    const { namespace, user, items, customer, paymentFilters } = req.body
    logger.debug(
      `Create Order with Items for namespace ${namespace} and user ${user}`
    )

    const orderData = await createOrderWithItems({
      namespace,
      user,
      items,
      customer,
      ...calculateTotalsFromItems({ items }),
    })
    const paymentFilterData = await savePaymentFiltersAdmin(paymentFilters)

    const dto = new Data({
      ...orderData,
      paymentFilters: paymentFilterData,
    })
    return this.created<any>(res, dto.serialize())
  }
}
