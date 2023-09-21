import {
  AbstractController,
  ExperienceError,
  logger,
  StatusCode,
} from '@verkkokauppa/core'
import type { Request, Response } from 'express'
import {
  confirmOrder,
  createAccountingEntryForOrder,
  getOrderAdmin,
} from '@verkkokauppa/order-backend'
import { URL } from 'url'
import {
  getPublicServiceConfiguration,
  parseMerchantIdFromFirstOrderItem,
} from '@verkkokauppa/configuration-backend'
import {
  checkPaytrailCardReturnUrl,
  paidPaymentExists,
} from '@verkkokauppa/payment-backend'
import { sendReceiptToCustomer } from '../lib/sendEmail'
import { getProductAccountingBatch } from '@verkkokauppa/product-backend'
import { sendErrorNotification } from '@verkkokauppa/message-backend'

export class PaytrailCardRedirectSuccessController extends AbstractController {
  protected readonly requestSchema = null

  private static success = (url: URL, orderId?: string, user?: string) => {
    url.pathname = `${orderId}/success`
    if (user) {
      url.searchParams.append('user', user)
    }
    return url
  }

  private static fault = (url: URL, orderId?: string, user?: string) => {
    url.pathname = orderId ? `${orderId}/summary` : 'summary'
    url.searchParams.append('paymentPaid', 'false')

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
          PaytrailCardRedirectSuccessController.fault(redirectUrl).toString()
        )
      }
      const order = await getOrderAdmin({ orderId })
      user = order.user

      if (await paidPaymentExists(order)) {
        return res.redirect(
          302,
          PaytrailCardRedirectSuccessController.fault(
            redirectUrl,
            orderId,
            user
          ).toString()
        )
      }

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

      // Now we confirm order and check if sums and other are ok. Mappings should be good now
      const confirmedOrder = await confirmOrder({ orderId, user: order.user })

      const payment = await checkPaytrailCardReturnUrl({
        params: req.query,
        order: confirmedOrder,
        merchantId: parseMerchantIdFromFirstOrderItem(confirmedOrder) || '',
      })

      if (payment.status !== 'payment_paid_online') {
        return res.redirect(
          302,
          PaytrailCardRedirectSuccessController.fault(
            redirectUrl,
            orderId,
            user
          ).toString()
        )
      }

      const paymentReturnStatus = {
        paymentPaid: payment.status === 'payment_paid_online',
        paymentType: payment.paymentType,
      }

      // send email receipt. Method does not throw exceptions
      await sendReceiptToCustomer(paymentReturnStatus, orderId, order)

      try {
        logger.info(`Load paytrail product accountings for order ${orderId}`)
        const productAccountings = await getProductAccountingBatch({
          productIds: order.items.map((item) => item.productId),
        })

        const accountingDtos = order.items.map((item) => {
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
        })

        logger.info(
          `Create accounting entry for paytrail order ${orderId} with accountings ${JSON.stringify(
            productAccountings
          )}`
        )

        await createAccountingEntryForOrder({
          orderId,
          dtos: accountingDtos,
        })
      } catch (e) {
        // log error
        logger.error('Creating accountings failed: ' + e.toString())
        // send notification to Slack channel (email) that creating accountings failed
        await sendErrorNotification({
          message:
            'Creating accountings failed in paytrailCardRedirectSuccessController',
          cause: e.toString(),
        })
      }

      return res.redirect(
        302,
        PaytrailCardRedirectSuccessController.success(
          redirectUrl,
          orderId,
          user
        ).toString()
      )
    } catch (e) {
      logger.error(e)
      return res.redirect(
        302,
        PaytrailCardRedirectSuccessController.fault(
          redirectUrl,
          orderId,
          user
        ).toString()
      )
    }
  }
}
