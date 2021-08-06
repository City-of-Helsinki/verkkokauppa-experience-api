import { AbstractController, Data, logger } from '@verkkokauppa/core'
import type { Request, Response } from 'express'
import { setCustomerToOrder } from '@verkkokauppa/order-backend'
import { validateCustomer } from '../lib/validation'

export class SetCustomerController extends AbstractController {
  protected async implementation(req: Request, res: Response): Promise<any> {
    const { orderId } = req.params
    const { customer } = req.body

    if (orderId === undefined) {
      return this.clientError(res, 'Order ID not specified')
    }
    if (!(await validateCustomer(customer))) {
      return this.clientError(res, 'Required fields are missing for customer')
    }
    const dto = new Data()

    logger.debug(
      `Setting Customer with name: ${customer.firstName} ${customer.lastName}, email ${customer.email} and phone ${customer.phone} to order ${orderId}`
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
