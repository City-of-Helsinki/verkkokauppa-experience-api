import { AbstractController, Data, logger } from '@verkkokauppa/core'
import type { Request, Response } from 'express'
import { getCart } from '@verkkokauppa/cart-backend'
import type { CommonExperienceRequest } from '@verkkokauppa/types'

export class GetController extends AbstractController {
  protected async implementation(
    req: Request<CommonExperienceRequest>,
    res: Response
  ): Promise<any> {
    const { id } = req.params
    const dto = new Data()

    logger.debug(`Fetch cart ${id}`)

    const cartPromise = getCart({ id })

    try {
      const cartResult = await cartPromise
      dto.data = cartResult.data
    } catch (error) {
      logger.error(error)
      if (error.response.status === 404) {
        return this.notFound(res, `Cart ${id} not found`)
      }
      if (error.response.status === 400) {
        return this.clientError(res, 'Invalid request')
      }
      return this.fail(res, error.toString())
    }
    return this.success<any>(res, dto.serialize())
  }
}
