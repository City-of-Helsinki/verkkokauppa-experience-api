import axios from 'axios'
import { stringify } from 'qs'

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
  firstName: string
  lastName: string
  email: string
}
export interface Order {
  orderId: string
  namespace: string
  user: string
  createdAt: string
  items: OrderItem[]
  checkoutUrl?: string
  customer?: OrderCustomer
  status?: string
}

interface OrderBackendResponse {
  orderId: string
  namespace: string
  user: string
  createdAt: string
  customerFirstName?: string
  customerLastName?: string
  customerEmail?: string
  status?: string
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
  const url = `${process.env.ORDER_BACKEND_URL}/order/create`
  const result = await axios.get<OrderBackendResponse>(url, {
    params: {
      namespace,
      user,
    },
  })
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
  customer: OrderCustomer
}): Promise<Order> => {
  const { namespace, user, customer, items } = p
  if (!process.env.ORDER_BACKEND_URL) {
    throw new Error('No order backend URL set')
  }
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
  const url = `${process.env.ORDER_BACKEND_URL}/order/createWithItems`
  const result = await axios.post<OrderWithItemsBackendResponse>(
    url,
    requestDto
  )
  return {
    ...transFormBackendOrder(result.data),
    checkoutUrl: `${process.env.CHECKOUT_BASE_URL}?orderId=${result.data.order.orderId}`,
  }
}

export const cancelOrder = async (p: { orderId: string }): Promise<Order> => {
  const { orderId } = p
  if (!process.env.ORDER_BACKEND_URL) {
    throw new Error('No order backend URL set')
  }
  const url = `${process.env.ORDER_BACKEND_URL}/order/cancel`
  const result = await axios.get<OrderWithItemsBackendResponse>(url, {
    params: { orderId },
  })
  return transFormBackendOrder(result.data)
}

export const setCustomerToOrder = async (p: {
  orderId: string
  customer: OrderCustomer
}): Promise<Order> => {
  const { orderId, customer } = p
  if (!process.env.ORDER_BACKEND_URL) {
    throw new Error('No order backend URL set')
  }

  const url = `${process.env.ORDER_BACKEND_URL}/order/setCustomer`
  const result = await axios.post<OrderWithItemsBackendResponse>(url, null, {
    params: {
      orderId,
      customerEmail: customer.email,
      customerFirstName: customer.firstName,
      customerLastName: customer.lastName,
    },
    paramsSerializer: function (params) {
      return stringify(params, { arrayFormat: 'brackets' })
    },
  })
  return transFormBackendOrder(result.data)
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
    items,
  }
  const url = `${process.env.ORDER_BACKEND_URL}/order/setItems`
  const result = await axios.post<OrderWithItemsBackendResponse>(url, dto, {
    params: { orderId },
  })
  return transFormBackendOrder(result.data)
}

export const getOrder = async (p: { orderId: string }): Promise<Order> => {
  const { orderId } = p
  if (!process.env.ORDER_BACKEND_URL) {
    throw new Error('No order backend URL set')
  }
  const url = `${process.env.ORDER_BACKEND_URL}/order/get`
  const result = await axios.get<OrderWithItemsBackendResponse>(url, {
    params: { orderId },
  })
  return transFormBackendOrder(result.data)
}

const transFormBackendOrder = (p: OrderWithItemsBackendResponse): Order => {
  const {
    order: {
      orderId,
      namespace,
      user,
      createdAt,
      customerEmail,
      customerFirstName,
      customerLastName,
      status,
    },
    items,
  } = p
  let customer
  if (customerFirstName && customerLastName && customerEmail) {
    customer = {
      firstName: customerFirstName,
      lastName: customerLastName,
      email: customerEmail,
    }
  }
  return {
    orderId,
    namespace,
    user,
    createdAt,
    items,
    customer,
    status,
  }
}
