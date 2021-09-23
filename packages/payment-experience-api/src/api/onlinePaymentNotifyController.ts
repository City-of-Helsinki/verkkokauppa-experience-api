import {
  AbstractController,
  caseUtils,
  ExperienceError,
  ExperienceFailure,
  logger,
  StatusCode,
} from '@verkkokauppa/core'
import type { Request, Response } from 'express'
import { parseOrderIdFromRedirect } from '../lib/vismaPay'
import {
  createAccountingEntryForOrder,
  getOrderAdmin,
  OrderNotFoundError,
} from '@verkkokauppa/order-backend'
import { getProductAccountingBatch } from '@verkkokauppa/product-backend'
import {
  checkVismaReturnUrl,
  getPaymentForOrder,
  Order,
} from '@verkkokauppa/payment-backend'
import { sendEmailToCustomer } from '@verkkokauppa/message-backend'
import {
  getMerchantDetailsForOrder,
  ServiceConfiguration,
} from '@verkkokauppa/configuration-backend'

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

export class OnlinePaymentNotifyController extends AbstractController {
  protected readonly requestSchema = null

  protected async implementation(
    request: Request,
    response: Response
  ): Promise<any> {
    const { query } = request
    const vismaStatus = await checkVismaReturnUrl({ params: query })
    const orderId = parseOrderIdFromRedirect({ query })

    logger.info('Online payment notify controller called')

    if (!orderId) {
      logger.error('No orderId specified')
      throw new OrderNotFoundError()
    }
    logger.debug(
      `VismaStatus callback for order ${orderId}: ${JSON.stringify(
        vismaStatus
      )}`
    )
    logger.info(`Load order ${orderId} from payment callback`)
    const order = await getOrderAdmin({ orderId })
    logger.info(`Load product accountings for order`)
    const productAccountings = await getProductAccountingBatch({
      productIds: order.items.map((item) => item.productId),
    })
    if (vismaStatus.paymentPaid) {
      logger.info(
        `Create accounting entry for order ${orderId} with accountings ${JSON.stringify(
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
      logger.info(`Send receipt for order ${orderId}`)
      await this.sendReceipt(order)
    }
    return this.success<any>(response, vismaStatus)
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
      emailHeader: 'Tilausvahvistus ja kuitti / Order confirmation and receipt / Beställningsbekräftelse och kvitto',
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
