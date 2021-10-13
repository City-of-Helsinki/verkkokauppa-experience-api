import {
  AbstractController,
  caseUtils,
  ExperienceFailure,
  logger,
} from '@verkkokauppa/core'
import type { Request, Response } from 'express'
import {
  createUserRedirectUrl,
  parseOrderIdFromRedirect,
} from '../lib/vismaPay'
import { URL } from 'url'
import { getOrderAdmin } from '@verkkokauppa/order-backend'
import {
  checkVismaReturnUrl,
  getPaymentForOrder,
  Order,
} from '@verkkokauppa/payment-backend'
import {
  getMerchantDetailsForOrder,
  ServiceConfiguration,
} from '@verkkokauppa/configuration-backend'
import { sendEmailToCustomer } from '@verkkokauppa/message-backend'

enum MerchantConfigurationKeys {
  MERCHANT_NAME = 'merchantName',
  MERCHANT_STREET = 'merchantStreet',
  MERCHANT_ZIP = 'merchantZip',
  MERCHANT_CITY = 'merchantCity',
  MERCHANT_EMAIL = 'merchantEmail',
  MERCHANT_PHONE = 'merchantPhone',
  MERCHANT_URL = 'merchantUrl',
  MERCHANT_TERMS_OF_SERVICE_URL = 'merchantTermsOfServiceUrl',
  MERCHANT_BUSINESS_ID = 'merchantBusinessId',
}

type MerchantDetails = {
  [key in MerchantConfigurationKeys]: string
}

export class OnlinePaymentReturnController extends AbstractController {
  protected readonly requestSchema = null

  protected async implementation(
    request: Request,
    result: Response
  ): Promise<any> {
    const { query } = request
    if (!process.env.REDIRECT_PAYMENT_URL_BASE) {
      throw new Error('No default redirect url specified')
    }
    const orderId = parseOrderIdFromRedirect({ query })

    if (!orderId) {
      logger.error('No orderId specified redirect to general failure url')
      return result.redirect(
        302,
        OnlinePaymentReturnController.getFailureRedirectUrl().toString()
      )
    }

    try {
      const vismaStatus = await checkVismaReturnUrl({ params: query })
      logger.debug(
        `VismaStatus for order ${orderId}: ${JSON.stringify(vismaStatus)}`
      )
      if (!vismaStatus.valid) {
        logger.debug(
          `VismaStatus is not valid for ${orderId}, redirect to failure url`
        )
        return result.redirect(
          302,
          OnlinePaymentReturnController.getFailureRedirectUrl().toString()
        )
      }
      const order = await getOrderAdmin({ orderId })
      const redirectUrl = await createUserRedirectUrl({
        order,
        vismaStatus,
      })
      if (vismaStatus.paymentPaid) {
        logger.info(`Send receipt for order ${orderId}`)
        try {
          await this.sendReceipt(order)
        } catch (e) {
          // Skip errors for receipt sending
          logger.error(e)
        }
      }
      return result.redirect(302, redirectUrl.toString())
    } catch (error) {
      logger.error(error)
      logger.debug(
        `Error occurred, redirect user to failure url for order ${orderId}`
      )
      return result.redirect(
        302,
        OnlinePaymentReturnController.getFailureRedirectUrl().toString()
      )
    }
  }

  private static getFailureRedirectUrl() {
    if (!process.env.REDIRECT_PAYMENT_URL_BASE) {
      throw new Error('No default redirect url specified')
    }
    const redirectUrl = new URL(process.env.REDIRECT_PAYMENT_URL_BASE)
    redirectUrl.pathname = 'failure'

    return redirectUrl.toString()
  }

  // TODO: Abstract merchant transformation and fix keys to use same casing!
  protected transformConfigurationToMerchant(p: ServiceConfiguration[]) {
    if (!p || p.length === 0 || !Array.isArray(p)) {
      return undefined
    }
    return p.reduce<MerchantDetails>((acc, current) => {
      acc[
        caseUtils.toCamelCase(
          current.configurationKey
        ) as MerchantConfigurationKeys
      ] = current.configurationValue
      return acc
    }, {} as MerchantDetails)
  }

  public async sendReceipt(order: Order) {
    const payments = await getPaymentForOrder(order)
    const merchantConfiguration = await getMerchantDetailsForOrder(order)
    const orderWithPayments = {
      ...order,
      payment: payments,
      merchant: this.transformConfigurationToMerchant(merchantConfiguration),
    }
    const email = await sendEmailToCustomer({
      order: orderWithPayments,
      fileName: 'orderConfirmation',
      emailHeader:
        'Tilausvahvistus ja kuitti / Order confirmation and receipt / Beställningsbekräftelse och kvitto',
      sendTo: orderWithPayments?.customer?.email || '',
    })
    if (email.error !== '') {
      throw new ExperienceFailure({
        code: 'failed-to-send-order-confirmation-email',
        message: `Cannot send order confirmation email to customer`,
        source: email.error,
      })
    }
    return email
  }
}
