import axios from 'axios'
import type { Subscription } from './types'
import type { Order, OrderItemMeta } from '../types'
import { ExperienceFailure } from '@verkkokauppa/core'
import { OrderNotFoundError, SubscriptionNotFoundError } from '../errors'

const SUBSCRIPTION_API_ROOT = '/subscription'

const checkBackendUrlExists = () => {
  if (!process.env.ORDER_BACKEND_URL) {
    throw new Error('No order backend URL set')
  }
}

export const createSubscription = async (
  dto: Partial<Subscription>
): Promise<{ id: string }> => {
  checkBackendUrlExists()

  const url = `${process.env.ORDER_BACKEND_URL + SUBSCRIPTION_API_ROOT}`
  try {
    const result = await axios.post<{ id: string }>(url, dto)
    return result.data
  } catch (e) {
    throw new ExperienceFailure({
      code: 'failed-to-create-subscription',
      message: 'Failed to create subscription',
      source: e,
    })
  }
}

export const createSubscriptionsFromOrder = async (
  p: Order
): Promise<string[]> => {
  checkBackendUrlExists()

  const { orderId, user: userId } = p
  const url = `${
    process.env.ORDER_BACKEND_URL + SUBSCRIPTION_API_ROOT
  }/create-from-order`
  try {
    const result = await axios.get<string[]>(url, {
      params: { orderId, userId },
    })

    return result.data
  } catch (e) {
    if (e.response?.status === 404) {
      throw new OrderNotFoundError()
    }
    throw new ExperienceFailure({
      code: 'failed-to-create-subscriptions-from-order',
      message: `Failed to create subscriptions from order ${orderId}`,
      source: e,
    })
  }
}

export const getSubscription = async (p: {
  id: string
  user: string
}): Promise<Subscription> => {
  const { id, user: userId } = p
  checkBackendUrlExists()

  const url = `${process.env.ORDER_BACKEND_URL + SUBSCRIPTION_API_ROOT}`
  try {
    const result = await axios.get<Subscription>(url, {
      params: { id, userId },
    })
    return result.data
  } catch (e) {
    if (e.response?.status === 404) {
      throw new SubscriptionNotFoundError(id)
    }
    throw new ExperienceFailure({
      code: 'failed-to-get-subscription',
      message: `Failed to get subscription ${id}`,
      source: e,
    })
  }
}

export const getSubscriptionAdmin = async (p: {
  id: string
}): Promise<Subscription> => {
  const { id } = p
  checkBackendUrlExists()

  const url = `${process.env.ORDER_BACKEND_URL}/subscription-admin/get`
  try {
    const result = await axios.get<Subscription>(url, {
      params: { id },
    })
    return result.data
  } catch (e) {
    if (e.response?.status === 404) {
      throw new SubscriptionNotFoundError(id)
    }
    throw new ExperienceFailure({
      code: 'failed-to-get-subscription',
      message: `Failed to get subscription ${id}`,
      source: e,
    })
  }
}

export const incrementValidationFailedEmailSentCountAdmin = async (p: {
  subscriptionId: string
}): Promise<Subscription> => {
  const { subscriptionId } = p
  checkBackendUrlExists()

  const url = `${process.env.ORDER_BACKEND_URL}/subscription-admin/validation-failed-email-sent-increment`
  try {
    const result = await axios.get<Subscription>(url, {
      params: { subscriptionId },
    })
    return result.data
  } catch (e) {
    if (e.response?.status === 404) {
      throw new SubscriptionNotFoundError(subscriptionId)
    }
    throw new ExperienceFailure({
      code: 'failed-to-increment-validation-failed-email-count-subscription',
      message: `Failed to increment validation email sent count to subscription ${subscriptionId}`,
      source: e,
    })
  }
}

export const searchActiveSubscriptions = async (p: {
  activeAtDate: string
  customerEmail: string
  status: string
  namespace: string
}): Promise<Subscription[]> => {
  checkBackendUrlExists()

  const url = `${
    process.env.ORDER_BACKEND_URL + SUBSCRIPTION_API_ROOT
  }/search/active`
  try {
    const result = await axios.post<Subscription[]>(url, {
      params: p,
    })

    return result.data
  } catch (e) {
    throw new ExperienceFailure({
      code: 'failed-to-search-active-subscriptions',
      message: 'Failed to search active subscriptions',
      source: e,
    })
  }
}

export const cancelSubscription = async (p: {
  id: string
  user: string
}): Promise<Subscription> => {
  const { id, user: userId } = p
  checkBackendUrlExists()

  const url = `${process.env.ORDER_BACKEND_URL + SUBSCRIPTION_API_ROOT}/cancel`
  try {
    const result = await axios.post<Subscription>(url, undefined, {
      params: { id, userId },
    })
    return result.data
  } catch (e) {
    throw new ExperienceFailure({
      code: 'failed-to-cancel-subscription',
      message: 'Failed to cancel subscription',
      source: e,
    })
  }
}
// TODO: update method?

export const setSubscriptionItemMeta = async (p: {
  subscriptionId: string
  orderItemId: string
  meta: {
    orderItemMetaId?: string
    key: string
    value: string
    label?: string
    visibleInCheckout?: boolean | string
    ordinal?: string
  }[]
}): Promise<OrderItemMeta[]> => {
  const { subscriptionId, orderItemId, meta } = p
  checkBackendUrlExists()
  const url = `${process.env.ORDER_BACKEND_URL}/subscription-admin/set-item-meta`
  try {
    const res = await axios.post(url, meta, {
      params: { subscriptionId, orderItemId },
    })
    return res.data
  } catch (e) {
    throw new ExperienceFailure({
      code: 'failed-to-set-subscription-item-meta',
      message: 'Failed to set subscription item meta',
      source: e,
    })
  }
}

export const setSubscriptionCardToken = async (p: {
  subscriptionId: string
  user: string
  paymentMethodToken: string
  paymentMethodExpirationYear: string
  paymentMethodExpirationMonth: string
  paymentMethodCardLastFourDigits: string
}) => {
  const {
    subscriptionId,
    user,
    paymentMethodCardLastFourDigits,
    paymentMethodToken,
    paymentMethodExpirationMonth,
    paymentMethodExpirationYear,
  } = p
  checkBackendUrlExists()
  const url = `${process.env.ORDER_BACKEND_URL}/subscription/set-card-token`
  try {
    const res = await axios.put(url, {
      subscriptionId,
      user,
      paymentCardInfoDto: {
        cardToken: paymentMethodToken,
        expYear: paymentMethodExpirationYear,
        expMonth: paymentMethodExpirationMonth,
        cardLastFourDigits: paymentMethodCardLastFourDigits,
      },
    })
    return res.data
  } catch (e) {
    throw new ExperienceFailure({
      code: 'failed-to-set-subscription-card-token',
      message: 'Failed to set subscription card token',
      source: e,
    })
  }
}
