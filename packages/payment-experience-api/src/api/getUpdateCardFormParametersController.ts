import {
  AbstractController,
  Data,
  ExperienceError,
  logger,
  StatusCode,
  ValidatedRequest,
} from '@verkkokauppa/core'
import type { Response } from 'express'
import * as yup from 'yup'
import {
  getUpdatePaytrailCardFormParams,
  PaymentGateway,
} from '@verkkokauppa/payment-backend'
import { getOrder } from '@verkkokauppa/order-backend'
import { parseMerchantIdFromFirstOrderItem } from '@verkkokauppa/configuration-backend'

const requestSchema = yup.object().shape({
  params: yup.object().shape({
    orderId: yup.string().required(),
  }),
  headers: yup.object().shape({
    user: yup.string().required(),
  }),
})

export class GetUpdateCardFormParametersController extends AbstractController<
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

    logger.debug(`Fetch updateCardFormParameters ${orderId}`)

    const order = await getOrder({ orderId, user })

    if (order.subscriptionId == null) {
      throw new ExperienceError({
        code: 'failed-order-is-not-subscription',
        message:
          'Order has to be a subscription to fetch card form parameters.',
        responseStatus: StatusCode.BadRequest,
        logLevel: 'info',
      })
    }

    if (
      order.paymentMethod?.gateway !== null &&
      order.paymentMethod?.gateway !== PaymentGateway.PAYTRAIL
    ) {
      throw new ExperienceError({
        code: 'failed-gateway-type-is-not-paytrail',
        message: `Payment gateway has to be ${PaymentGateway.PAYTRAIL} to get card form parameters.`,
        responseStatus: StatusCode.BadRequest,
        logLevel: 'info',
      })
    }

    const merchantId = parseMerchantIdFromFirstOrderItem(order)

    if (!merchantId) {
      throw new ExperienceError({
        code: 'merchant-id-not-found',
        message: 'No merchantId found from order.',
        responseStatus: StatusCode.NotFound,
        logLevel: 'info',
      })
    }

    const dto = new Data(
      await getUpdatePaytrailCardFormParams({
        namespace: order.namespace,
        merchantId,
        orderId,
      })
    )

    return this.success<any>(res, dto.serialize())
  }
}
