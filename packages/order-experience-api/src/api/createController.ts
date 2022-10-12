import {
  AbstractController,
  Data,
  logger,
  RequestValidationError,
  ValidatedRequest,
} from '@verkkokauppa/core'
import type { Response } from 'express'
import {
  createOrder,
  createOrderWithItems,
  Order,
} from '@verkkokauppa/order-backend'
import {
  PaymentFilter,
  ReferenceType,
  savePaymentFiltersAdmin,
} from '@verkkokauppa/payment-backend'
import { getProductMapping } from '@verkkokauppa/product-mapping-backend'
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
    paymentFilters: paymentFiltersSchema.notRequired(),
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

    const paymentFiltersData = await this.saveOrderPaymentFilters(
      orderData,
      paymentFilters
    )

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

    // Set merchant id for items from corresponding product mapping
    for (const item of items) {
      const productMapping = await getProductMapping({
        productId: item.productId,
      })
      item.merchantId = productMapping ? productMapping.merchantId : null
    }

    const orderData = await createOrderWithItems({
      namespace,
      user,
      items,
      customer,
      ...calculateTotalsFromItems({ items }),
    })

    const paymentFiltersData = await this.saveOrderPaymentFilters(
      orderData,
      paymentFilters
    )

    const dto = new Data({
      ...orderData,
      paymentFilters: paymentFiltersData,
    })
    return this.created<any>(res, dto.serialize())
  }

  private async saveOrderPaymentFilters(
    orderData: Order,
    paymentFilters: PaymentFilter[]
  ) {
    if (!!paymentFilters && paymentFilters.length > 0) {
      paymentFilters.forEach((filter: any) => {
        filter.referenceId = orderData.orderId
        filter.referenceType = ReferenceType.ORDER
      })
      return await savePaymentFiltersAdmin(paymentFilters)
    } else {
      return []
    }
  }
}
