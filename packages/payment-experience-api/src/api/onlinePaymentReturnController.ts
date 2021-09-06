import {
  AbstractController,
  logger,
  ValidatedRequest,
} from '@verkkokauppa/core'
import type { Response } from 'express'
import {
  createUserRedirectUrl,
  parseOrderIdFromRedirect,
} from '../lib/vismaPay'
import { URL } from 'url'
import { getOrder } from '@verkkokauppa/order-backend'
import { checkVismaReturnUrl } from '@verkkokauppa/payment-backend'
import * as yup from 'yup'

const requestSchema = yup.object().shape({
  params: yup.object().shape({
    user: yup.string().required(),
  }),
})

export class OnlinePaymentReturnController extends AbstractController<
  typeof requestSchema
> {
  protected readonly requestSchema = requestSchema

  protected async implementation(
    request: ValidatedRequest<typeof requestSchema>,
    result: Response
  ): Promise<any> {
    const {
      query,
      params: { user },
    } = request
    if (!process.env.REDIRECT_PAYMENT_URL_BASE) {
      throw new Error('No default redirect url specified')
    }
    try {
      const vismaStatus = await checkVismaReturnUrl({ params: query })
      if (!vismaStatus.valid) {
        console.log('VismaStatus is not valid, redirect to failure url')
        return result.redirect(
          302,
          OnlinePaymentReturnController.getFailureRedirectUrl().toString()
        )
      }
      const orderId = parseOrderIdFromRedirect({ query })
      if (!orderId) {
        console.error('No orderId specified')
        return result.redirect(
          302,
          OnlinePaymentReturnController.getFailureRedirectUrl().toString()
        )
      }
      console.log(
        `VismaStatus for order ${orderId}: ${JSON.stringify(vismaStatus)}`
      )
      const order = await getOrder({ orderId, user })
      const redirectUrl = await createUserRedirectUrl({
        order,
        vismaStatus,
      })
      return result.redirect(302, redirectUrl.toString())
    } catch (error) {
      logger.error(error)
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
}
