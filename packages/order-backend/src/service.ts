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
  checkoutUrl?: string
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
  return {
    ...result.data,
    items: [],
    checkoutUrl: `${process.env.CHECKOUT_BASE_URL}?orderId=${result.data.orderId}`,
  }
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
  return {
    ...result.data.order,
    items: result.data.items,
    checkoutUrl: `${process.env.CHECKOUT_BASE_URL}?orderId=${result.data.order.orderId}`,
  }
}

export const cancelOrder = async (p: { orderId: string }): Promise<Order> => {
  const { orderId } = p
  if (!process.env.ORDER_BACKEND_URL) {
    throw new Error('No order backend URL set')
  }
  const url = `${process.env.ORDER_BACKEND_URL}/order/cancel?orderId=${orderId}`
  const result = await axios.get<OrderWithItemsBackendResponse>(url)
  return {
    ...result.data.order,
    items: result.data.items,
  }
}

export const addItemToOrder = async (p: {
  orderId: string
  items: OrderItemRequest[]
}): Promise<Order> => {
  const { orderId, items } = p
  if (!process.env.ORDER_BACKEND_URL) {
    throw new Error('No order backend URL set')
  }
  const dto = {
    items
  }
  const url = `${process.env.ORDER_BACKEND_URL}/order/setItems?orderId=${orderId}`
  const result = await axios.post<OrderWithItemsBackendResponse>(url, dto)
  return {
    ...result.data.order,
    items: result.data.items,
    checkoutUrl: `${process.env.CHECKOUT_BASE_URL}?orderId=${result.data.order.orderId}`,
  }
}
