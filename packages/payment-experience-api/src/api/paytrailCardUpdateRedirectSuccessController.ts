import { AbstractController, logger } from '@verkkokauppa/core'
import type { Request, Response } from 'express'
import { URL } from 'url'
import { getOrderAdmin } from '@verkkokauppa/order-backend'
import { checkPaytrailCardUpdateReturnUrl } from '@verkkokauppa/payment-backend'

export class PaytrailCardUpdateRedirectSuccessController extends AbstractController {
  protected readonly requestSchema = null

  private static success = (
    url: URL,
    orderId?: string,
    user?: string,
    cardLastFourDigits?: string,
    cardExpiry?: string
  ) => {
    url.pathname = `${orderId}/card-update-success`
    if (user) {
      url.searchParams.append('user', user)
    }
    if (cardLastFourDigits) {
      url.searchParams.append('cardLastFourDigits', cardLastFourDigits)
    }
    if (cardExpiry) {
      url.searchParams.append('cardExpiry', cardExpiry)
    }

    return url
  }

  private static fault = (url: URL, orderId?: string, user?: string) => {
    url.pathname = orderId
      ? `${orderId}/card-update-failed`
      : 'card-update-failed'
    if (user) {
      url.searchParams.append('user', user)
    }
    return url
  }

  protected async implementation(req: Request, res: Response): Promise<any> {
    const globalRedirectUrl = process.env.REDIRECT_PAYTRAIL_PAYMENT_URL_BASE
    if (!globalRedirectUrl) {
      throw new Error('No default paytrail redirect url defined')
    }
    let redirectUrl = new URL(globalRedirectUrl)
    const { orderId } = req.params
    let user = ''
    try {
      if (!orderId) {
        return res.redirect(
          302,
          PaytrailCardUpdateRedirectSuccessController.fault(
            redirectUrl
          ).toString()
        )
      }

      const order = await getOrderAdmin({ orderId })
      user = order.user
      const paytrailCardResponse = await checkPaytrailCardUpdateReturnUrl({
        params: req.query,
        order,
      })

      return res.redirect(
        302,
        PaytrailCardUpdateRedirectSuccessController.success(
          redirectUrl,
          orderId,
          user,
          paytrailCardResponse.partial_pan,
          `${paytrailCardResponse.expire_month}/${paytrailCardResponse.expire_year}`
        ).toString()
      )
    } catch (e) {
      logger.error(e)
      return res.redirect(
        302,
        PaytrailCardUpdateRedirectSuccessController.fault(
          redirectUrl,
          orderId,
          user
        ).toString()
      )
    }
  }
}
