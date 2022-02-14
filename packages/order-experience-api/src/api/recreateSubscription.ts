import {
  AbstractController,
  Data,
  ExperienceError,
  ExperienceFailure,
  StatusCode,
  ValidatedRequest,
} from '@verkkokauppa/core'
import type { Response } from 'express'
import {
  cancelSubscription,
  createSubscription,
  getSubscriptionAdmin,
  setSubscriptionCardToken,
  setSubscriptionItemMeta,
} from '@verkkokauppa/order-backend'
import * as yup from 'yup'
import { validateApiKey } from '@verkkokauppa/configuration-backend'

const requestSchema = yup.object().shape({
  params: yup.object().shape({
    id: yup.string().required(),
  }),
  headers: yup.object().shape({
    'api-key': yup.string().required(),
    namespace: yup.string().required(),
  }),
  body: yup.object().shape({
    updatedFields: yup
      .object()
      .shape({
        customerPhone: yup.string(),
        customerFirstName: yup.string(),
        customerLastName: yup.string(),
        customerEmail: yup.string(),
        productName: yup.string(),
        productLabel: yup.string(),
        productDescription: yup.string(),
        productId: yup.string(),
        periodUnit: yup.string(),
        periodFrequency: yup.number(),
        periodCount: yup.number(),
        vatPercentage: yup.string(),
        priceNet: yup.string(),
        priceVat: yup.string(),
        priceGross: yup.string(),
      })
      .noUnknown(),
  }),
})

export class RecreateSubscriptionController extends AbstractController<
  typeof requestSchema
> {
  protected readonly requestSchema = requestSchema

  protected async implementation(
    req: ValidatedRequest<typeof requestSchema>,
    res: Response
  ): Promise<any> {
    const {
      params: { id: oldSubscriptionId },
      headers: { 'api-key': apiKey, namespace },
      body: { updatedFields },
    } = req

    await validateApiKey({ apiKey, namespace })

    const {
      id,
      subscriptionId,
      orderId,
      paymentMethodExpirationYear,
      paymentMethodExpirationMonth,
      paymentMethodToken,
      paymentMethodCardLastFourDigits,
      meta,
      status,
      ...oldSubscription
    } = await getSubscriptionAdmin({ id: oldSubscriptionId })

    if (status !== 'active') {
      throw new ExperienceError({
        code: 'subscription-validation-failed',
        message: `subscription ${subscriptionId} must be active to recreate`,
        logLevel: 'debug',
        responseStatus: StatusCode.BadRequest,
      })
    }

    const newSubscription = await createSubscription({
      ...oldSubscription,
      ...updatedFields,
      startDate: new Date().toISOString(),
      endDate: oldSubscription.endDate,
      billingStartDate: oldSubscription.endDate,
    })

    try {
      if (paymentMethodToken) {
        await setSubscriptionCardToken({
          subscriptionId: newSubscription.id,
          user: oldSubscription.user,
          paymentMethodCardLastFourDigits,
          paymentMethodToken,
          paymentMethodExpirationMonth,
          paymentMethodExpirationYear,
        })
      }

      if (meta?.length > 0) {
        await setSubscriptionItemMeta({
          subscriptionId: newSubscription.id,
          orderItemId: oldSubscription.orderItemId,
          meta: meta.map((m) => ({
            ...m,
            orderItemMetaId: undefined,
          })),
        })
      }

      await cancelSubscription({
        id: subscriptionId,
        user: oldSubscription.user,
      })
    } catch (e) {
      await cancelSubscription({
        id: newSubscription.id,
        user: oldSubscription.user,
      })
      throw new ExperienceFailure({
        code: 'failed-to-recreate-subscription',
        message: `Failed to recreate subscription ${subscriptionId}`,
        source: e,
      })
    }

    return this.created(res, new Data(newSubscription).serialize())
  }
}
