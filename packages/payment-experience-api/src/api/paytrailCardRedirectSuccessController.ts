import {
  AbstractController,
  ExperienceError,
  logger,
  StatusCode,
} from '@verkkokauppa/core'
import type { Request, Response } from 'express'
import {
  createAccountingEntryForOrder,
  getOrderAdmin,
} from '@verkkokauppa/order-backend'
import { URL } from 'url'
import { getPublicServiceConfiguration } from '@verkkokauppa/configuration-backend'
import { checkPaytrailCardReturnUrl } from '@verkkokauppa/payment-backend'
import { sendReceiptToCustomer } from '../lib/sendEmail'
import { getProductAccountingBatch } from '@verkkokauppa/product-backend'

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
      const { orderId } = req.params

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

      // send email receipt. Method does not throw exceptions
      await sendReceiptToCustomer(payment, orderId, order)

      logger.info(`Load paytrail product accountings for order ${orderId}`)
      const productAccountings = await getProductAccountingBatch({
        productIds: order.items.map((item) => item.productId),
      })

      logger.info(
        `Create accounting entry for paytrail order ${orderId} with accountings ${JSON.stringify(
          productAccountings
        )}`
      )

      await createAccountingEntryForOrder({
        orderId,
        dtos: order.items.map((item) => {
          const productAccounting = productAccountings.find(
            (accountingData) => accountingData.productId === item.productId
          )
          if (!productAccounting) {
            throw new ExperienceError({
              code: 'failed-to-create-order-accounting-entry',
              message: `No accounting entry found for product ${item.productId}`,
              responseStatus: StatusCode.BadRequest,
              logLevel: 'error',
            })
          }
          return {
            ...item,
            ...productAccounting,
          }
        }),
      })

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
