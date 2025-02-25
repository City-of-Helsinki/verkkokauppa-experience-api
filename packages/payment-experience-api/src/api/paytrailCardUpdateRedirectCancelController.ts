import { AbstractController, logger } from '@verkkokauppa/core'
import type { Request, Response } from 'express'
import { URL } from 'url'
import { getOrderAdmin } from '@verkkokauppa/order-backend'

export class PaytrailCardUpdateRedirectCancelController extends AbstractController {
  protected readonly requestSchema = null

  public static redirect = (url: URL, orderId?: string, user?: string) => {
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
    logger.info(
      `PaytrailCardUpdateRedirectCancelController request parameters: order: ${orderId} ${JSON.stringify(
        req.query
      )}`
    )
    try {
      if (!orderId) {
        return res.redirect(
          302,
          PaytrailCardUpdateRedirectCancelController.redirect(
            redirectUrl
          ).toString()
        )
      }

      await getOrderAdmin({ orderId })

      return res.redirect(
        302,
        PaytrailCardUpdateRedirectCancelController.redirect(
          redirectUrl,
          orderId
        ).toString()
      )
    } catch (e) {
      logger.error(e)
      return res.redirect(
        302,
        PaytrailCardUpdateRedirectCancelController.redirect(
          redirectUrl,
          orderId
        ).toString()
      )
    }
  }
}
