import axios from 'axios'

interface OrderItemRequest {
  productId: string
  productName: string
  quantity: number
  unit: string
  rowPriceNet: number
  rowPriceVat: number
  rowPriceTotal: number
}
export type OrderItem = OrderItemRequest & {
  orderItemId: string
  orderId: string
}
interface OrderCustomer {
  name: string
  email: string
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

type OrderWithItemsBackendResponse = {
  order: OrderBackendResponse
  items: OrderItem[]
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

export const createOrderWithItems = async (p: {
  namespace: string
  user: string
  items: OrderItemRequest[]
  customer?: OrderCustomer
}): Promise<Order> => {
  const { namespace, user, customer, items } = p
  if (!process.env.ORDER_BACKEND_URL) {
    throw new Error('No order backend URL set')
  }
  const dto = {
    order: {
      namespace,
      user,
      customerName: customer?.name,
      customerEmail: customer?.email,
    },
    items,
  }
  const url = `${process.env.ORDER_BACKEND_URL}/order/createWithItems`
  const result = await axios.post<OrderWithItemsBackendResponse>(url, dto)
  return { ...result.data.order, items: result.data.items }
}
