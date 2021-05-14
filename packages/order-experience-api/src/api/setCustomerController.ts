import { AbstractController, Data, logger } from '@verkkokauppa/core'
import type { Request, Response } from 'express'
import { setCustomerToOrder } from '@verkkokauppa/order-backend'

export class SetCustomerController extends AbstractController {
  protected async implementation(req: Request, res: Response): Promise<any> {
    const { orderId, customerName, customerEmail } = req.params

    if (orderId === undefined) {
      return this.clientError(res, 'Order ID not specified')
    }
    if (customerName === undefined) {
      return this.clientError(res, 'Customer name not specified')
    }
    if (customerEmail === undefined) {
      return this.clientError(res, 'Customer email not specified')
    }
    const dto = new Data()

    logger.debug(
      `Setting Customer with name: ${customerName} and email ${customerEmail} to order ${orderId}`
    )

    try {
      dto.data = await setCustomerToOrder({
        orderId,
        customerName,
        customerEmail
      })
    } catch (error) {
      logger.error(error)
      if (error.response.status === 400) {
        return this.clientError(res, 'Invalid request')
      }
      return this.fail(res, error.toString())
    }
    return this.success<any>(res, dto.serialize())
  }
}
