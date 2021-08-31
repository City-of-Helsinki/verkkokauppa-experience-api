import {
  AbstractController,
  Data,
  logger,
  ValidatedRequest,
} from '@verkkokauppa/core'
import type { Response } from 'express'
import {
  getOrder,
  OrderValidationError,
  setOrderTotals,
} from '@verkkokauppa/order-backend'
import { calculateTotalsFromItems } from '../lib/totals'
import * as yup from 'yup'

const requestSchema = yup.object().shape({
  params: yup.object().shape({
    orderId: yup.string().required(),
  }),
})

export class CalculateTotalsController extends AbstractController<
  typeof requestSchema
> {
  protected readonly requestSchema = requestSchema

  protected async implementation(
    req: ValidatedRequest<typeof requestSchema>,
    res: Response
  ): Promise<any> {
    const {
      params: { orderId },
    } = req

    logger.debug(`Calculate totals for Order ${orderId}`)

    const order = await getOrder({ orderId })

    if (order.items === undefined) {
      throw new OrderValidationError('order must have at least one item')
    }

    const dto = new Data(
      await setOrderTotals({
        orderId,
        ...calculateTotalsFromItems(order),
      })
    )

    return this.success<any>(res, dto.serialize())
  }
}
