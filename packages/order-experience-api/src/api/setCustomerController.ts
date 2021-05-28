import { AbstractController, Data, logger } from '@verkkokauppa/core'
import type { Request, Response } from 'express'
import { setCustomerToOrder } from '@verkkokauppa/order-backend'

export class SetCustomerController extends AbstractController {
  protected async implementation(req: Request, res: Response): Promise<any> {
    const { orderId } = req.params
    const { customer } = req.body

    if (orderId === undefined) {
      return this.clientError(res, 'Order ID not specified')
    }
    if (customer.firstName === undefined) {
      return this.clientError(res, 'Customer firstname not specified')
    }
    if (customer.lastName === undefined) {
      return this.clientError(res, 'Customer lastname not specified')
    }
    if (customer.email === undefined) {
      return this.clientError(res, 'Customer email not specified')
    }
    const dto = new Data()

    logger.debug(
      `Setting Customer with name: ${customer.firstName} ${customer.lastName} and email ${customer.email} to order ${orderId}`
    )

    try {
      dto.data = await setCustomerToOrder({
        orderId,
        customer,
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
