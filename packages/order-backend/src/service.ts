import axios from 'axios'
import { stringify } from 'qs'
import type {
  Order,
  OrderAccounting,
  OrderAccountingRequest,
  OrderCustomer,
  OrderInvoice,
  OrderInvoiceRequest,
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
  SetInvoiceToOrderFailure,
  SetOrderTotalsFailure,
  SubscriptionNotFoundError,
} from './errors'
import { ExperienceFailure } from '@verkkokauppa/core'

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

export const setInvoiceToOrder = async (p: {
  orderId: string
  user: string
  invoice: OrderInvoice
}): Promise<Order> => {
  const { orderId, invoice, user: userId } = p
  if (!process.env.ORDER_BACKEND_URL) {
    throw new Error('No order backend URL set')
  }

  const url = `${process.env.ORDER_BACKEND_URL}/order/setInvoice`
  const orderInvoiceRequestDto: OrderInvoiceRequest = {
    ...invoice,
    orderId,
    userId,
  }
  try {
    const result = await axios.post<OrderWithItemsBackendResponse>(
      url,
      orderInvoiceRequestDto
    )
    return transFormBackendOrder(result.data)
  } catch (e) {
    if (e.response?.status === 403) {
      throw new OrderValidationError('order is in an immutable state')
    }
    if (e.response?.status === 404) {
      throw new OrderNotFoundError()
    }
    throw new SetInvoiceToOrderFailure(e)
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
      invoice,
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
    subscriptionId,
    invoice,
    checkoutUrl: `${process.env.CHECKOUT_BASE_URL}${orderId}`,
    receiptUrl: `${process.env.CHECKOUT_BASE_URL}${orderId}/receipt?user=${user}`,
    loggedInCheckoutUrl: `${process.env.CHECKOUT_BASE_URL}profile/${orderId}`,
    updateCardUrl: `${process.env.CHECKOUT_BASE_URL}${orderId}/update-card?user=${user}`,
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

export const getOrdersBySubscription = async (p: {
  subscriptionId: string
  user: string
}): Promise<Order[]> => {
  const { subscriptionId, user: userId } = p
  const url = `${process.env.ORDER_BACKEND_URL}/order/get-by-subscription`
  try {
    const res = await axios.get(url, {
      params: { subscriptionId, userId },
    })
    return res.data.map((order: OrderWithItemsBackendResponse) =>
      transFormBackendOrder(order)
    )
  } catch (e) {
    if (e.response?.status === 404) {
      throw new SubscriptionNotFoundError(subscriptionId)
    }
    throw new ExperienceFailure({
      code: 'failed-to-get-subscription-orders',
      message: `Failed to get orders for subscription ${subscriptionId}`,
      source: e,
    })
  }
}

export const getOrdersByUserAdmin = async (p: {
  user: string
}): Promise<Order[]> => {
  const { user: userId } = p
  const url = `${process.env.ORDER_BACKEND_URL}/order-admin/get-all`
  try {
    const res = await axios.get(url, {
      params: { userId },
    })
    return res.data.map((order: OrderWithItemsBackendResponse) =>
      transFormBackendOrder(order)
    )
  } catch (e) {
    throw new ExperienceFailure({
      code: 'failed-to-get-orders',
      message: `Failed to get orders for user ${userId}`,
      source: e,
    })
  }
}
