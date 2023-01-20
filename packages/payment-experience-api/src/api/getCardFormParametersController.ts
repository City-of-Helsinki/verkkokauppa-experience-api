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
  getPaytrailPaymenCardFormParams,
  PaymentGateway,
} from '@verkkokauppa/payment-backend'
import { getOrderAdmin } from '@verkkokauppa/order-backend'
import { parseMerchantIdFromFirstOrderItem } from '@verkkokauppa/configuration-backend'

const requestSchema = yup.object().shape({
  params: yup.object().shape({
    orderId: yup.string().required(),
  }),
  headers: yup.object().shape({
    user: yup.string().required(),
  }),
})

export class GetCardFormParametersController extends AbstractController<
  typeof requestSchema
> {
  protected readonly requestSchema = requestSchema

  protected async implementation(
    req: ValidatedRequest<typeof requestSchema>,
    res: Response
  ): Promise<any> {
    const {
      params: { orderId },
    } = req

    logger.debug(`Fetch cardFormParameters ${orderId}`)

    const order = await getOrderAdmin({ orderId })

    if (order.type !== 'subscription') {
      logger.error(
        'Order has to be a subscription to fetch card form parameters'
      )
      throw new ExperienceError({
        code: 'failed-order-is-not-subscription',
        message:
          'Order has to be a subscription to fetch card form parameters.',
        responseStatus: StatusCode.NotFound,
        logLevel: 'info',
      })
    }

    if (
      !order.paymentMethod ||
      order.paymentMethod.gateway !== PaymentGateway.PAYTRAIL
    ) {
      logger.error(
        `Payment gateway has to be ${PaymentGateway.PAYTRAIL} to get card form parameters`
      )
      throw new ExperienceError({
        code: 'failed-gateway-type-is-not-paytrail',
        message: `Payment gateway has to be ${PaymentGateway.PAYTRAIL} to get card form parameters.`,
        responseStatus: StatusCode.NotFound,
        logLevel: 'info',
      })
    }

    const merchantId = parseMerchantIdFromFirstOrderItem(order)

    if (!merchantId) {
      logger.error('No merchantId found from order')
      throw new ExperienceError({
        code: 'merchant-id-not-found',
        message: 'No merchantId found from order.',
        responseStatus: StatusCode.NotFound,
        logLevel: 'info',
      })
    }

    const dto = new Data(
      await getPaytrailPaymenCardFormParams({
        namespace: order.namespace,
        merchantId,
      })
    )

    return this.success<any>(res, dto.serialize())
  }
}
