import axios from 'axios'
import type {Order} from "./types"

export const getPaymentRequestData = async (parameters: Order): Promise<string> => {
  const order = parameters
  if (!process.env.PAYMENT_BACKEND_URL) {
    throw new Error('No payment API backend URL set')
  }

  let paymentMethodUrl = "billing" // TODO: or online based on something?
  const url = `${process.env.PAYMENT_BACKEND_URL}/payment/${paymentMethodUrl}/createFromOrder`

  // We use POST instead of GET since we need to send complex parameters,
  // although using GET would be semantically more correct.
  const result = await axios.post<string>(
    url, order
  )

  return result.data
}
