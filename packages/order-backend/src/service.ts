import axios from 'axios'
import { stringify } from 'qs'
import type {
  Order,
  OrderAccounting,
  OrderAccountingRequest,
  OrderCustomer,
  OrderItemRequest,
  OrderWithItemsBackendResponse,
} from './types'
import {
  AddItemsToOrderFailure,
  CancelOrderFailure,
  ConfirmOrderFailure,
  CreateOrderAccountingFailure,
  CreateOrderFailure,
  CreateOrderWithItemsFailure,
  GetOrderFailure,
  OrderNotFoundError,
  OrderValidationError,
  SetCustomerToOrderFailure,
  SetOrderTotalsFailure,
} from './errors'

export const createOrder = async (p: {
  namespace: string
  user: string
}): Promise<Order> => {
  const { namespace, user } = p
  if (!process.env.ORDER_BACKEND_URL) {
    throw new Error('No order backend URL set')
  }
  const url = `${process.env.ORDER_BACKEND_URL}/order/create`
  try {
    const result = await axios.get<OrderWithItemsBackendResponse>(url, {
      params: {
        namespace,
        user,
      },
    })
    return transFormBackendOrder(result.data)
  } catch (e) {
    throw new CreateOrderFailure(e)
  }
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
  try {
    const result = await axios.post<OrderWithItemsBackendResponse>(
      url,
      requestDto
    )
    return transFormBackendOrder(result.data)
  } catch (e) {
    throw new CreateOrderWithItemsFailure(e)
  }
}

export const cancelOrder = async (p: {
  orderId: string
  user: string
}): Promise<Order> => {
  const { orderId, user: userId } = p
  if (!process.env.ORDER_BACKEND_URL) {
    throw new Error('No order backend URL set')
  }
  const url = `${process.env.ORDER_BACKEND_URL}/order/cancel`
  try {
    const result = await axios.get<OrderWithItemsBackendResponse>(url, {
      params: { orderId, userId },
    })
    return transFormBackendOrder(result.data)
  } catch (e) {
    if (e.response?.status === 404) {
      throw new OrderNotFoundError()
    }
    throw new CancelOrderFailure(e)
  }
}

export const confirmOrder = async (p: {
  orderId: string
  user: string
}): Promise<Order> => {
  const { orderId, user: userId } = p
  if (!process.env.ORDER_BACKEND_URL) {
    throw new Error('No order backend URL set')
  }
  const url = `${process.env.ORDER_BACKEND_URL}/order/confirm`
  try {
    const result = await axios.get<OrderWithItemsBackendResponse>(url, {
      params: { orderId, userId },
    })
    return transFormBackendOrder(result.data)
  } catch (e) {
    if (e.response?.status === 403) {
      throw new OrderValidationError('order must have customer and totals')
    }
    if (e.response?.status === 404) {
      throw new OrderNotFoundError()
    }
    throw new ConfirmOrderFailure(e)
  }
}

export const setCustomerToOrder = async (p: {
  orderId: string
  user: string
  customer: OrderCustomer
}): Promise<Order> => {
  const { orderId, customer, user: userId } = p
  if (!process.env.ORDER_BACKEND_URL) {
    throw new Error('No order backend URL set')
  }

  const url = `${process.env.ORDER_BACKEND_URL}/order/setCustomer`
  try {
    const result = await axios.post<OrderWithItemsBackendResponse>(url, null, {
      params: {
        orderId,
        userId,
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
  } catch (e) {
    if (e.response?.status === 403) {
      throw new OrderValidationError('order is in an immutable state')
    }
    if (e.response?.status === 404) {
      throw new OrderNotFoundError()
    }
    throw new SetCustomerToOrderFailure(e)
  }
}

export const addItemsToOrder = async (p: {
  orderId: string
  user: string
  items: OrderItemRequest[]
}): Promise<Order> => {
  const { orderId, items, user: userId } = p
  if (!process.env.ORDER_BACKEND_URL) {
    throw new Error('No order backend URL set')
  }
  const dto = {
    items,
  }
  const url = `${process.env.ORDER_BACKEND_URL}/order/setItems`
  try {
    const result = await axios.post<OrderWithItemsBackendResponse>(url, dto, {
      params: { orderId, userId },
    })
    return transFormBackendOrder(result.data)
  } catch (e) {
    if (e.response?.status === 403) {
      throw new OrderValidationError('order is in an immutable state')
    }
    if (e.response?.status === 404) {
      throw new OrderNotFoundError()
    }
    throw new AddItemsToOrderFailure(e)
  }
}

export const getOrder = async (p: {
  orderId: string
  user: string
}): Promise<Order> => {
  const { orderId, user: userId } = p
  if (!process.env.ORDER_BACKEND_URL) {
    throw new Error('No order backend URL set')
  }
  const url = `${process.env.ORDER_BACKEND_URL}/order/get`
  try {
    const result = await axios.get<OrderWithItemsBackendResponse>(url, {
      params: { orderId, userId },
    })
    return transFormBackendOrder(result.data)
  } catch (e) {
    if (e.response?.status === 404) {
      throw new OrderNotFoundError()
    }
    throw new GetOrderFailure(e)
  }
}

export const getOrderAdmin = async (p: { orderId: string }): Promise<Order> => {
  const { orderId } = p
  if (!process.env.ORDER_BACKEND_URL) {
    throw new Error('No order backend URL set')
  }
  const url = `${process.env.ORDER_BACKEND_URL}/order-admin/get`
  try {
    const result = await axios.get<OrderWithItemsBackendResponse>(url, {
      params: { orderId },
    })
    return transFormBackendOrder(result.data)
  } catch (e) {
    if (e.response?.status === 404) {
      throw new OrderNotFoundError()
    }
    throw new GetOrderFailure(e)
  }
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
      subscriptionId,
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
  let receiptPath = `/receipt`
  let data: any = {
    orderId,
    namespace,
    user,
    createdAt,
    items,
    customer,
    status,
    type,
    subscriptionId,
    checkoutUrl: `${process.env.CHECKOUT_BASE_URL}${orderId}`,
    receiptUrl: `${process.env.CHECKOUT_BASE_URL}${orderId}${receiptPath}?user=${user}`,
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
  user: string
  priceNet: string | number
  priceVat: string | number
  priceTotal: string | number
}): Promise<Order> => {
  const { orderId, priceNet, priceVat, priceTotal, user: userId } = p
  if (!process.env.ORDER_BACKEND_URL) {
    throw new Error('No order backend URL set')
  }
  const url = `${process.env.ORDER_BACKEND_URL}/order/setTotals`
  try {
    const result = await axios.post<OrderWithItemsBackendResponse>(url, null, {
      params: {
        orderId,
        userId,
        priceNet: priceNet.toString(),
        priceVat: priceVat.toString(),
        priceTotal: priceTotal.toString(),
      },
    })
    return transFormBackendOrder(result.data)
  } catch (e) {
    if (e.response?.status === 403) {
      throw new OrderValidationError('order is in an immutable state')
    }
    if (e.response?.status === 404) {
      throw new OrderNotFoundError()
    }
    throw new SetOrderTotalsFailure(e)
  }
}

export const createAccountingEntryForOrder = async (
  p: OrderAccountingRequest
): Promise<any> => {
  if (!process.env.ORDER_BACKEND_URL) {
    throw new Error('No order backend URL set')
  }
  const { orderId, dtos } = p
  const url = `${process.env.ORDER_BACKEND_URL}/order/accounting/create`
  try {
    const dto = {
      orderId,
      dtos,
    }
    const result = await axios.post<OrderAccounting>(url, dto)
    return result.data
  } catch (e) {
    throw new CreateOrderAccountingFailure(e)
  }
}
