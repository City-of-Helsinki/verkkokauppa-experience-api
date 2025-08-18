import {
  AbstractController,
  ExperienceError,
  logger,
  StatusCode,
} from '@verkkokauppa/core'
import * as yup from 'yup'
import type { Request, Response } from 'express'
import {
  createInvoicingEntryForOrder,
  getOrder,
  OrderNotFoundError,
  setOrderAsAccounted,
} from '@verkkokauppa/order-backend'
import {
  getProductAccountingBatch,
  getProductInvoicings,
} from '@verkkokauppa/product-backend'
import { URL } from 'url'
import {
  checkInvoiceReturnUrl,
  paidPaymentExists,
} from '@verkkokauppa/payment-backend'
import { sendReceipt } from '../lib/sendEmail'
import { sendErrorNotification } from '@verkkokauppa/message-backend'
import {
  getPublicServiceConfiguration,
  parseMerchantIdFromFirstOrderItem,
} from '@verkkokauppa/configuration-backend'

export class InvoicingRedirectController extends AbstractController {
  protected readonly requestSchema = null

  private static fault = (url: URL, user?: string | null) => {
    url.pathname = 'failure'
    if (user) {
      url.searchParams.append('user', user)
    }
    return url.toString()
  }

  private static success = (url: URL, user?: string) => {
    url.pathname = 'success'
    if (user) {
      url.searchParams.append('user', user)
    }
    return url.toString()
  }

  protected async implementation(req: Request, res: Response) {
    const globalRedirectUrl = process.env.REDIRECT_PAYMENT_URL_BASE
    if (!globalRedirectUrl) {
      throw new Error('No default redirect url defined')
    }
    let redirectUrl = new URL(globalRedirectUrl)

    const {
      query: { orderId, user },
    } = req

    if (typeof orderId !== 'string' || typeof user !== 'string') {
      return res.redirect(302, InvoicingRedirectController.fault(redirectUrl))
    }

    try {
      redirectUrl.pathname = orderId + '/'

      const order = await getOrder({ orderId, user })

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
        redirectUrl.searchParams.append('orderId', order.orderId)
      }

      const merchantId = parseMerchantIdFromFirstOrderItem(order)

      if (!merchantId) {
        logger.error('Free: No merchantId found from order')
        return res.redirect(
          302,
          InvoicingRedirectController.fault(redirectUrl, user)
        )
      }

      if (await paidPaymentExists(order)) {
        return res.redirect(
          302,
          InvoicingRedirectController.fault(redirectUrl, user)
        )
      }

      const paymentStatus = await checkInvoiceReturnUrl({
        orderId: orderId,
        merchantId: merchantId,
      })
      logger.debug(
        `PaymentStatus for invoicing order ${orderId}: ${JSON.stringify(
          paymentStatus
        )}`
      )
      if (!paymentStatus.valid) {
        logger.debug(
          `PaymentStatus is not valid for invoicing order ${orderId}, redirect to failure url`
        )
        return res.redirect(
          302,
          InvoicingRedirectController.fault(redirectUrl, user)
        )
      }

      const productInvoicings = await getProductInvoicings({
        productIds: order.items.map((i) => i.productId),
      })

      const productAccountings = await getProductAccountingBatch({
        productIds: order.items.map((i) => i.productId),
      })

      try {
        await createInvoicingEntryForOrder({
          items: order.items.map((item) => {
            const productAccounting = productAccountings.find(
              (i) => i?.productId === item.productId
            )
            if (!productAccounting) {
              throw new ExperienceError({
                code: 'failed-to-find-product-accounting',
                message: `No accounting entry found for product ${item.productId}`,
                responseStatus: StatusCode.InternalServerError,
                logLevel: 'error',
              })
            }
            const productInvoicing = productInvoicings.find(
              (i) => i?.productId === item.productId
            )
            if (!productInvoicing) {
              throw new ExperienceError({
                code: 'failed-to-find-product-invoicing',
                message: `No invoicing entry found for product ${item.productId}`,
                responseStatus: StatusCode.InternalServerError,
                logLevel: 'error',
              })
            }
            return yup
              .object({
                orderId: yup.string().required(),
                orderIncrementId: yup.string().required(),
                orderItemId: yup.string().required(),
                invoicingDate: yup.string().required(),
                customerOvt: yup.string().nullable().default(''),
                customerYid: yup.string().required(),
                customerName: yup.string().required(),
                customerAddress: yup.string().required(),
                customerPostcode: yup.string().required(),
                customerCity: yup.string().required(),
                material: yup.string().required(),
                orderType: yup.string().required(),
                salesOrg: yup.string().required(),
                salesOffice: yup.string().required(),
                materialDescription: yup.string().required(),
                quantity: yup.number().required(),
                unit: yup.string().required(),
                priceNet: yup.string().required(),
                internalOrder: yup.string().nullable().default(''),
                profitCenter: yup.string().nullable().default(''),
                project: yup.string().nullable().default(''),
                operationArea: yup.string().nullable().default(''),
              })
              .test((value) => {
                if (!value) return false

                // only internalOrder or profitCenter should be used
                // if neither of them is used then project should be defined
                const hasInternalOrder = !!value.internalOrder
                const hasProfitCenter = !!value.profitCenter
                const hasProject = !!value.project

                // InternalOrder and ProfitCenter should not be provided at the same time
                if (hasInternalOrder && hasProfitCenter) {
                  return false
                }

                // if neither provided then project is required
                if (!hasInternalOrder && !hasProfitCenter) {
                  return hasProject
                }

                return true
              })
              .validateSync({
                orderId: order.orderId,
                orderIncrementId: order.incrementId,
                orderItemId: item.orderItemId,
                invoicingDate: item.invoicingDate?.toISOString(),
                customerYid: order.invoice?.businessId,
                customerOvt: order.invoice?.ovtId,
                customerName: order.invoice?.name,
                customerAddress: order.invoice?.address,
                customerPostcode: order.invoice?.postcode,
                customerCity: order.invoice?.city,
                material: productInvoicing.material,
                orderType: productInvoicing.orderType,
                salesOrg: productInvoicing.salesOrg,
                salesOffice: productInvoicing.salesOffice,
                materialDescription: item.productName,
                quantity: item.quantity,
                unit: item.unit,
                priceNet: item.priceNet,
                internalOrder: productAccounting?.internalOrder,
                profitCenter: productAccounting?.profitCenter,
                project: productAccounting?.project,
                operationArea: productAccounting.operationArea,
              })
          }),
        })
      } catch (e) {
        // send notification to Slack channel (email) that sending receipt faile
        await sendErrorNotification({
          message: `Creating invoicing entry for order ${orderId} failed`,
          cause: e.toString(),
          header: 'Error - Creating invoicing entry for order failed',
        })
      }

      try {
        await setOrderAsAccounted(orderId)
      } catch (e) {
        logger.error(e)
        logger.debug(
          `Error occurred when trying to set free order as accounted ${orderId}`
        )
      }

      try {
        await sendReceipt(order, false)
      } catch (e) {
        logger.error(e)

        // send notification to Slack channel (email) that sending receipt failed
        await sendErrorNotification({
          message: `Sending receipt failed for invoice order ${orderId}`,
          cause: e.toString(),
          header: 'Error - Sending receipt failed',
        })
      }

      return res.redirect(
        302,
        InvoicingRedirectController.success(redirectUrl, user)
      )
    } catch (e) {
      logger.error(e)

      try {
        if (!(e instanceof OrderNotFoundError)) {
          await sendErrorNotification({
            cause: 'Invoicing redirect controller error',
            message: `Error while handling invoicing (order ${orderId}, user ${user}, error ${e.toString()})`,
            header: 'Error occurred in invoicing redirect controller',
          })
        }
      } catch (e) {
        logger.error(e)
      }

      return res.redirect(
        302,
        InvoicingRedirectController.success(redirectUrl, user)
      )
    }
  }
}
