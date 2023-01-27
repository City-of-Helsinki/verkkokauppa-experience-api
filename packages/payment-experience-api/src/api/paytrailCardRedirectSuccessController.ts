import { AbstractController, logger } from '@verkkokauppa/core'
import type { Request, Response } from 'express'
import { getOrderAdmin } from '@verkkokauppa/order-backend'
import { URL } from 'url'
import { getPublicServiceConfiguration } from '@verkkokauppa/configuration-backend'
import { checkPaytrailCardReturnUrl } from '@verkkokauppa/payment-backend'

export class PaytrailCardRedirectSuccessController extends AbstractController {
  protected readonly requestSchema = null

  private static success = (url: URL) => {
    url.pathname = 'success'
    return url
  }

  private static fault = (url: URL) => {
    url.pathname = 'summary'
    url.searchParams.append('paymentPaid', 'false')
    return url
  }

  protected async implementation(req: Request, res: Response): Promise<any> {
    const globalRedirectUrl = process.env.REDIRECT_PAYTRAIL_PAYMENT_URL_BASE
    if (!globalRedirectUrl) {
      throw new Error('No default paytrail redirect url defined')
    }
    let redirectUrl = new URL(globalRedirectUrl)
    try {
      const orderId = req.params['orderId']

      if (!orderId) {
        return res.redirect(
          302,
          PaytrailCardRedirectSuccessController.fault(redirectUrl).toString()
        )
      }

      const order = await getOrderAdmin({ orderId })

      const serviceConfigurationRedirectUrl = await getPublicServiceConfiguration(
        {
          namespace: order.namespace,
          key: 'ORDER_CREATED_REDIRECT_URL',
        }
      )

      if (serviceConfigurationRedirectUrl?.configurationValue) {
        redirectUrl = new URL(
          serviceConfigurationRedirectUrl.configurationValue
        )
      }

      const payment = await checkPaytrailCardReturnUrl({
        params: req.query,
        order,
      })

      if (payment.status !== 'payment_paid_online') {
        return res.redirect(
          302,
          PaytrailCardRedirectSuccessController.fault(redirectUrl).toString()
        )
      }

      return res.redirect(
        302,
        PaytrailCardRedirectSuccessController.success(redirectUrl).toString()
      )
    } catch (e) {
      logger.error(e)
      return res.redirect(
        302,
        PaytrailCardRedirectSuccessController.fault(redirectUrl).toString()
      )
    }
  }
}
