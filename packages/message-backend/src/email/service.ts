import axios from 'axios'
import type { IdWrapper, RecurringOrder } from './types'

// noinspection SpellCheckingInspection
const EMAIL_MESSAGE_ROUTE = '/email'

const checkBackendUrlExists = () => {
  if (!process.env.ORDER_BACKEND_URL) {
    throw new Error('No order backend URL set')
  }
}

export const createRecurringOrder = async (
  p: RecurringOrder
): Promise<IdWrapper> => {
  checkBackendUrlExists()

  const url = `${process.env.ORDER_BACKEND_URL + EMAIL_MESSAGE_ROUTE}`
  const result = await axios.post<IdWrapper>(url, {
    params: p,
  })

  return result.data
}
