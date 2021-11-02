import axios from 'axios'
import type { Subscription } from './types'
import type { Order } from '../types'
import {
  ExperienceError,
  ExperienceFailure,
  StatusCode,
} from '@verkkokauppa/core'
import { OrderNotFoundError } from '../errors'

const SUBSCRIPTION_API_ROOT = '/subscription'

const checkBackendUrlExists = () => {
  if (!process.env.ORDER_BACKEND_URL) {
    throw new Error('No order backend URL set')
  }
}

export const createSubscription = async (
  p: Subscription
): Promise<{ id: string }> => {
  checkBackendUrlExists()

  const url = `${process.env.ORDER_BACKEND_URL + SUBSCRIPTION_API_ROOT}`
  try {
    const result = await axios.post<{ id: string }>(url, {
      params: p,
    })
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
      throw new ExperienceError({
        code: 'subscription-not-found',
        message: `Subscription ${id} not found`,
        responseStatus: StatusCode.NotFound,
        logLevel: 'info',
      })
    }
    throw new ExperienceFailure({
      code: 'failed-to-get-subscription',
      message: `Failed to get subscription ${id}`,
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

// TODO: update method?
