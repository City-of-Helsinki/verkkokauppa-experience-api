import {
  AbstractController,
  Data,
  logger,
  ValidatedRequest,
} from '@verkkokauppa/core'
import type { Response } from 'express'
import { getOrderAdmin } from '@verkkokauppa/order-backend'
import * as yup from 'yup'
import {
  getMerchantDetailsForOrder,
  validateApiKey,
} from '@verkkokauppa/configuration-backend'
import { paidPaymentExists } from '@verkkokauppa/payment-backend'

const requestSchema = yup.object().shape({
  params: yup.object().shape({
    orderId: yup.string().required(),
  }),
  headers: yup.object().shape({
    'api-key': yup.string().required(),
    namespace: yup.string().required(),
  }),
})

export class GetAdminController extends AbstractController {
  protected readonly requestSchema = requestSchema

  protected async implementation(
    req: ValidatedRequest<typeof requestSchema>,
    res: Response
  ): Promise<any> {
    const {
      params: { orderId },
      headers: { 'api-key': apiKey, namespace },
    } = req

    await validateApiKey({ namespace, apiKey })

    logger.debug(`Fetch order ${orderId}`)
    const order = await getOrderAdmin({ orderId })
    const [merchant, orderIsPaid] = await Promise.all([
      getMerchantDetailsForOrder(order),
      paidPaymentExists(order),
    ])

    const dto = new Data({
      ...order,
      isValidForCheckout: !orderIsPaid,
      merchant,
    })

    return this.success<any>(res, dto.serialize())
  }
}
