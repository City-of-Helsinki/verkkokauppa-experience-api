import axios from 'axios'
import { stringify } from 'qs'
import type {
  Order,
  OrderCustomer,
  OrderItemRequest,
  OrderWithItemsBackendResponse,
} from './types'

export const createOrder = async (p: {
  namespace: string
  user: string
}): Promise<Order> => {
  const { namespace, user } = p
  if (!process.env.ORDER_BACKEND_URL) {
    throw new Error('No order backend URL set')
  }
  const url = `${process.env.ORDER_BACKEND_URL}/order/create`
  const result = await axios.get<OrderWithItemsBackendResponse>(url, {
    params: {
      namespace,
      user,
    },
  })
  return transFormBackendOrder(result.data)
}

export const createOrderWithItems = async (p: {
  namespace: string
  user: string
  priceNet: string
  priceVat: string
  priceTotal: string
  items: OrderItemRequest[]
  customer: OrderCustomer
}): Promise<Order> => {
  const { namespace, user, customer, items, priceNet, priceVat, priceTotal } = p
  if (!process.env.ORDER_BACKEND_URL) {
    throw new Error('No order backend URL set')
  }
  const requestDto = {
    order: {
      namespace,
      user,
      customerFirstName: customer?.firstName,
      customerLastName: customer?.lastName,
      customerPhone: customer?.phone,
      customerEmail: customer?.email,
      priceNet: priceNet.toString(),
      priceVat: priceVat.toString(),
      priceTotal: priceTotal.toString(),
    },
    items,
  }
  const url = `${process.env.ORDER_BACKEND_URL}/order/createWithItems`
  const result = await axios.post<OrderWithItemsBackendResponse>(
    url,
    requestDto
  )
  return transFormBackendOrder(result.data)
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
      customerPhone: customer.phone,
    },
    paramsSerializer: function (params) {
      return stringify(params, { arrayFormat: 'brackets' })
    },
  })
  return transFormBackendOrder(result.data)
}

export const addItemsToOrder = async (p: {
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
      customerPhone,
      status,
      priceNet,
      priceVat,
      priceTotal,
      type,
    },
    items,
  } = p
  let customer
  if (customerFirstName && customerLastName && customerEmail) {
    customer = {
      firstName: customerFirstName,
      lastName: customerLastName,
      email: customerEmail,
      phone: customerPhone,
    }
  }
  let data: any = {
    orderId,
    namespace,
    user,
    createdAt,
    items,
    customer,
    status,
    type,
    checkoutUrl: `${process.env.CHECKOUT_BASE_URL}?orderId=${orderId}`,
  }
  if (priceNet && priceVat && priceTotal) {
    data = {
      ...data,
      priceNet,
      priceVat,
      priceTotal,
    }
  }
  return data
}

export const setOrderTotals = async (p: {
  orderId: string
  priceNet: string | number
  priceVat: string | number
  priceTotal: string | number
}): Promise<Order> => {
  const { orderId, priceNet, priceVat, priceTotal } = p
  if (!process.env.ORDER_BACKEND_URL) {
    throw new Error('No order backend URL set')
  }
  const url = `${process.env.ORDER_BACKEND_URL}/order/setTotals`
  const result = await axios.post<OrderWithItemsBackendResponse>(url, null, {
    params: {
      orderId,
      priceNet: priceNet.toString(),
      priceVat: priceVat.toString(),
      priceTotal: priceTotal.toString(),
    },
  })
  return transFormBackendOrder(result.data)
}
