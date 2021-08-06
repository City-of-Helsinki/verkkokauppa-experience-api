import { AbstractController, Data, logger } from '@verkkokauppa/core'
import type { Request, Response } from 'express'
import { getOrder, OrderItem } from '@verkkokauppa/order-backend'
import { getPaymentMethodList } from '@verkkokauppa/payment-backend'

export class GetPaymentMethodListController extends AbstractController {
  protected async implementation(
    request: Request,
    result: Response
  ): Promise<any> {
    const { orderId } = request.params
    if (orderId === undefined) {
      return this.clientError(result, 'Order ID not specified')
    }

    const dto = new Data()
    try {
      const order = await getOrder({ orderId })
      dto.data = await getPaymentMethodList({
        request: {
          namespace: order.namespace,
          totalPrice: order.priceTotal
            ? parseFloat(order.priceTotal)
            : calculateTotalPrice(order.items),
        },
      })
    } catch (error) {
      logger.error(error)
      return this.fail(result, error.toString())
    }

    return this.success<any>(result, dto.serialize())
  }
}

const calculateTotalPrice = (items: OrderItem[]): number => {
  let totalPrice = 0
  for (const item of items) {
    totalPrice += parseFloat(item.rowPriceTotal)
  }
  return totalPrice
}
