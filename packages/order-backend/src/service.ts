import axios from 'axios'

export interface OrderItem {
  orderItemId: string
  orderId: string
}
export interface Order {
  orderId: string
  namespace: string
  user?: string
  createdAt: string
  items: OrderItem[]
}

interface OrderBackendResponse {
  orderId: string
  namespace: string
  user?: string
  createdAt: string
}

export const createOrder = async (p: {
  namespace: string
  user: string
}): Promise<Order> => {
  const { namespace, user } = p
  if (!process.env.ORDER_BACKEND_URL) {
    throw new Error('No order backend URL set')
  }
  const url = `${process.env.ORDER_BACKEND_URL}/order/create?namespace=${namespace}&user=${user}`
  const result = await axios.get<OrderBackendResponse>(url)
  return { ...result.data, items: [] }
}

