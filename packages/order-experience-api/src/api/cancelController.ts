import {
  AbstractController,
  Data,
  logger,
  ValidatedRequest,
} from '@verkkokauppa/core'
import type { Response } from 'express'
import { cancelOrder } from '@verkkokauppa/order-backend'
import { getPublicServiceConfiguration } from '@verkkokauppa/configuration-backend'
import { URL } from 'url'
import * as yup from 'yup'

const requestSchema = yup.object().shape({
  params: yup.object().shape({
    orderId: yup.string().required(),
  }),
  headers: yup.object().shape({
    user: yup.string().required(),
  }),
})

export class CancelController extends AbstractController<typeof requestSchema> {
  protected readonly requestSchema = requestSchema

  protected async implementation(
    req: ValidatedRequest<typeof requestSchema>,
    res: Response
  ): Promise<any> {
    const {
      params: { orderId },
      headers: { user },
    } = req

    logger.debug(`Cancel Order ${orderId}`)

    const order = await cancelOrder({ orderId, user })
    const cancelUrl = await CancelController.createCancelUrl(order)

    return this.success<any>(
      res,
      new Data({
        order,
        cancelUrl,
      }).serialize()
    )
  }

  private static async createCancelUrl(p: {
    namespace: string
    orderId: string
  }): Promise<string | null> {
    const { namespace, orderId } = p
    try {
      const cancelRedirectUrlConfiguration = await getPublicServiceConfiguration(
        {
          namespace: namespace,
          key: 'ORDER_CANCEL_REDIRECT_URL',
        }
      )
      const cancelUrl = new URL(
        cancelRedirectUrlConfiguration.configurationValue
      )
      cancelUrl.searchParams.append('orderId', orderId)
      return cancelUrl.toString()
    } catch (e) {
      console.error(e)
      return null
    }
  }
}
