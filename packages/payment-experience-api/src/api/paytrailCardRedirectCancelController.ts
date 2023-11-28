import { AbstractController, logger } from '@verkkokauppa/core'
import type { Request, Response } from 'express'
import { getOrderAdmin } from '@verkkokauppa/order-backend'
import { URL } from 'url'
import { getPublicServiceConfiguration } from '@verkkokauppa/configuration-backend'

export class PaytrailCardRedirectCancelController extends AbstractController {
  protected readonly requestSchema = null

  private static fault = (url: URL, user?: string) => {
    url.searchParams.append('paymentPaid', 'false')

    if (user) {
      url.searchParams.append('user', user)
    }

    return url
  }

  protected async implementation(req: Request, res: Response): Promise<any> {
    logger.info('Redirected to paytrailCardRedirectCancelController')
    const globalRedirectUrl = process.env.REDIRECT_PAYTRAIL_PAYMENT_URL_BASE
    if (!globalRedirectUrl) {
      throw new Error('No default paytrail redirect url defined')
    }
    const { orderId } = req.params
    let failureRedirectUrl = new URL(globalRedirectUrl)
    failureRedirectUrl.pathname = `${orderId ?? ''}/summary`

    let user = ''
    try {
      if (!orderId) {
        return res.redirect(
          302,
          PaytrailCardRedirectCancelController.fault(
            failureRedirectUrl
          ).toString()
        )
      }
      const order = await getOrderAdmin({ orderId })
      user = order.user

      // redirect to specific failure url if one is given
      const [nsFailureRedirectUrl] = await Promise.all([
        getPublicServiceConfiguration({
          namespace: order.namespace,
          key: 'orderPaymentFailedRedirectUrl',
        }),
      ])

      if (nsFailureRedirectUrl?.configurationValue) {
        failureRedirectUrl = new URL(nsFailureRedirectUrl.configurationValue)
        failureRedirectUrl.searchParams.append('orderId', orderId)
      }

      // in card payment cancel just redirect to the failure url
      return res.redirect(
        302,
        PaytrailCardRedirectCancelController.fault(
          failureRedirectUrl,
          user
        ).toString()
      )
    } catch (e) {
      return res.redirect(
        302,
        PaytrailCardRedirectCancelController.fault(
          failureRedirectUrl,
          user
        ).toString()
      )
    }
  }
}
