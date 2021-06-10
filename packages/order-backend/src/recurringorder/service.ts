import axios from 'axios'
import type { RecurringOrder, IdWrapper, RecurringOrderCriteria } from './types'
import type { Order } from '../types'

// noinspection SpellCheckingInspection
const RECURRING_ORDER_API_ROOT = '/recurringorder'

const checkBackendUrlExists = () => {
  if (!process.env.ORDER_BACKEND_URL) {
    throw new Error('No order backend URL set')
  }
}

export const createRecurringOrder = async (
  p: RecurringOrder
): Promise<IdWrapper> => {
  checkBackendUrlExists()

  const url = `${
    process.env.ORDER_BACKEND_URL + RECURRING_ORDER_API_ROOT
  }/create`
  const result = await axios.get<IdWrapper>(url, {
    params: p,
  })

  return result.data
}

export const createRecurringOrdersFromOrder = async (
  p: Order
): Promise<string[]> => {
  checkBackendUrlExists()

  const url = `${
    process.env.ORDER_BACKEND_URL + RECURRING_ORDER_API_ROOT
  }/create-from-order`
  const result = await axios.get<string[]>(url, {
    params: p,
  })

  return result.data
}

export const getRecurringOrder = async (p: {
  id: string
}): Promise<RecurringOrder> => {
  const { id } = p
  checkBackendUrlExists()

  const url = `${process.env.ORDER_BACKEND_URL + RECURRING_ORDER_API_ROOT}`
  const result = await axios.get<RecurringOrder>(url, {
    params: { id },
  })

  return result.data
}

export const searchActiveRecurringOrder = async (
  p: RecurringOrderCriteria
): Promise<RecurringOrder[]> => {
  checkBackendUrlExists()

  const url = `${
    process.env.ORDER_BACKEND_URL + RECURRING_ORDER_API_ROOT
  }/search/active`
  const result = await axios.get<RecurringOrder[]>(url, {
    params: p,
  })

  return result.data
}

// TODO: update method?
