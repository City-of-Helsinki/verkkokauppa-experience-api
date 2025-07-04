import {
  AbstractController,
  Data,
  logger,
  ValidatedRequest,
} from '@verkkokauppa/core'
import type { Response } from 'express'
import { cancelOrder, checkCanCancelOrder } from '@verkkokauppa/order-backend'
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

    logger.debug(`Check if we can cancel the order ${orderId}`)
    const canCancel = checkCanCancelOrder({ orderId })

    if (!canCancel) {
      // nothing to cancel
      return this.respond(
        res,
        403,
        'Can not cancel. If order is invoice could be canceller or invoiced already'
      )
    }
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

  public static async createCancelUrl(p: {
    namespace: string
    orderId: string
  }): Promise<string | null> {
    const { namespace, orderId } = p
    try {
      const cancelRedirectUrlConfiguration = await getPublicServiceConfiguration(
        {
          namespace: namespace,
          key: 'ORDER_CANCEL_REDIRECT_URL', // TODO needs to be changed to camel case in future?
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
