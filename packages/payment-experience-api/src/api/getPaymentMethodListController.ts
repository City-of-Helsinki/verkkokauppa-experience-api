import { AbstractController, Data, ValidatedRequest } from '@verkkokauppa/core'
import type { Response } from 'express'
import { getOrder, OrderItem } from '@verkkokauppa/order-backend'
import { getPaymentMethodList } from '@verkkokauppa/payment-backend'
import * as yup from 'yup'

const requestSchema = yup.object().shape({
  params: yup.object().shape({
    orderId: yup.string().required(),
  }),
})

export class GetPaymentMethodListController extends AbstractController<
  typeof requestSchema
> {
  protected readonly requestSchema = requestSchema
  protected async implementation(
    request: ValidatedRequest<typeof requestSchema>,
    result: Response
  ): Promise<any> {
    const {
      params: { orderId },
    } = request

    const order = await getOrder({ orderId })
    const dto = new Data(
      await getPaymentMethodList({
        request: {
          namespace: order.namespace,
          totalPrice: order.priceTotal
            ? parseFloat(order.priceTotal)
            : calculateTotalPrice(order.items),
        },
      })
    )

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
