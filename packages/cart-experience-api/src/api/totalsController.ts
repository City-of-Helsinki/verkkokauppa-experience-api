import {
  AbstractController,
  Data,
  logger,
  ValidatedRequest,
} from '@verkkokauppa/core'
import type { Response } from 'express'
import { getCart } from '@verkkokauppa/cart-backend'
import { calculate } from '../service/totalsService'
import * as yup from 'yup'

const requestSchema = yup.object().shape({
  params: yup.object().shape({
    cartId: yup.string().required(),
  }),
})

export class TotalsController extends AbstractController<typeof requestSchema> {
  protected readonly requestSchema = requestSchema

  protected async implementation(
    req: ValidatedRequest<typeof requestSchema>,
    res: Response
  ): Promise<any> {
    const {
      params: { cartId },
    } = req

    const dto = new Data()

    logger.debug(`Get cart ${cartId}`)
    const cart = await getCart({ cartId })
    logger.debug(`Calculate totals for cart ${cartId}`)
    if (cart.items && cart.items.length > 0) {
      dto.data = await calculate(cart)
    } else {
      dto.data = {
        ...cart,
        items: [],
      }
    }

    return this.success<any>(res, dto.serialize())
  }
}
