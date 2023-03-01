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
  calculateTotalsFromItems,
} from '@verkkokauppa/order-backend'
import * as yup from 'yup'

const requestSchema = yup.object().shape({
  params: yup.object().shape({
    orderId: yup.string().required(),
  }),
  headers: yup.object().shape({
    user: yup.string().required(),
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
      headers: { user },
    } = req

    logger.debug(`Calculate totals for Order ${orderId}`)

    const order = await getOrder({ orderId, user })

    if (order.items === undefined) {
      throw new OrderValidationError('order must have at least one item')
    }

    const dto = new Data(
      await setOrderTotals({
        orderId,
        user,
        ...calculateTotalsFromItems(order),
      })
    )

    return this.success<any>(res, dto.serialize())
  }
}
