import axios from 'axios'
import type {OrderCustomer, OrderItemRequest} from "./types"

export const getPaymentRequestData = async (parameters: {
  namespace: string
  user: string
  items: OrderItemRequest[]
  customer: OrderCustomer
}): Promise<string> => {
  const { namespace, user, customer, items } = parameters
  if (!process.env.PAYMENT_BACKEND_URL) {
    throw new Error('No payment API backend URL set')
  }

  // TODO: decide whether billing or online here?

  // TODO: order and items
  const requestDto = {
    order: {
      namespace,
      user,
      customerFirstName: customer?.firstName,
      customerLastName: customer?.lastName,
      customerEmail: customer?.email,
    },
    items,
  }
  const url = `${process.env.PAYMENT_BACKEND_URL}/payment/billing tai online/createFromOrder`

  // We use POST instead of GET since we need to send complex parameters,
  // although using GET would be semantically more correct.
  const result = await axios.post<string>(
    url,
    requestDto
  )

  return result // TODO: ok?
}
