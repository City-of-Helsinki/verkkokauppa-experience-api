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
import { createUserRedirectUrl } from '../lib/paymentReturnService'

export class PaytrailCardRedirectSuccessController extends AbstractController {
  protected readonly requestSchema = null

  private static success = (url: URL, orderId?: string, user?: string) => {
    url.pathname = `${orderId}/success`
    if (user) {
      url.searchParams.append('user', user)
    }
    return url
  }

  private static fault = (url: URL, user?: string) => {
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
    const { orderId } = req.params
    let successRedirectUrl = new URL(globalRedirectUrl)
    let failureRedirectUrl = new URL(globalRedirectUrl)
    failureRedirectUrl.pathname = `${orderId ?? ''}/summary`

    let user = ''
    try {
      if (!orderId) {
        return res.redirect(
          302,
          PaytrailCardRedirectSuccessController.fault(
            failureRedirectUrl
          ).toString()
        )
      }
      const order = await getOrderAdmin({ orderId })
      user = order.user

      const [nsFailureRedirectUrl] = await Promise.all([
        getPublicServiceConfiguration({
          namespace: order.namespace,
          key: 'orderPaymentFailedRedirectUrl',
        }),
      ])

      // if (nsSuccessRedirectUrl?.configurationValue) {
      //   successRedirectUrl = new URL(nsSuccessRedirectUrl.configurationValue)
      // }

      if (nsFailureRedirectUrl?.configurationValue) {
        failureRedirectUrl = new URL(nsFailureRedirectUrl.configurationValue)
        failureRedirectUrl.searchParams.append('orderId', orderId)
      }

      if (await paidPaymentExists(order)) {
        return res.redirect(
          302,
          PaytrailCardRedirectSuccessController.fault(
            failureRedirectUrl,
            user
          ).toString()
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
            failureRedirectUrl,
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
        logger.error(
          'Creating accountings in paytrailCardRedirectSuccessController failed: ' +
            e.toString()
        )
        // send notification to Slack channel (email) that creating accountings failed
        await sendErrorNotification({
          message:
            'Creating accountings failed in paytrailCardRedirectSuccessController',
          cause: e.toString(),
        })
      }

      const isPaymentPaid = payment.status === 'payment_paid_online'
      successRedirectUrl = await createUserRedirectUrl({
        order,
        paymentReturnStatus: {
          paymentPaid: isPaymentPaid,
          valid: isPaymentPaid,
          paymentType: payment.paymentType,
          authorized: false,
          canRetry: false,
        },
        redirectPaymentUrlBase: globalRedirectUrl,
      })

      return res.redirect(
        302,
        PaytrailCardRedirectSuccessController.success(
          successRedirectUrl,
          orderId,
          user
        ).toString()
      )
    } catch (e) {
      logger.error(e)
      return res.redirect(
        302,
        PaytrailCardRedirectSuccessController.fault(
          failureRedirectUrl,
          user
        ).toString()
      )
    }
  }
}
