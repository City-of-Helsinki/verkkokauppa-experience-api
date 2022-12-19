import type { Refund, RefundAggregate, RefundItem } from './types'
import axios from 'axios'
import {
  ExperienceError,
  ExperienceFailure,
  StatusCode,
} from '@verkkokauppa/core'
import type { Order } from '../types'

const getBackendUrl = () => {
  const url = process.env.ORDER_BACKEND_URL
  if (!url) {
    throw new Error('No order backend URL set')
  }
  return url
}

export const createRefund = async (p: {
  order: Order
  refundReason?: string
}): Promise<RefundAggregate> => {
  const { order: o } = p
  const url = `${getBackendUrl()}/refund/create`
  try {
    const res = await axios.post(url, {
      refund: {
        orderId: o.orderId,
        namespace: o.namespace,
        user: o.user,
        customerFirstName: o.customer?.firstName,
        customerLastName: o.customer?.lastName,
        customerEmail: o.customer?.email,
        customerPhone: o.customer?.phone,
        priceNet: o.priceNet,
        priceVat: o.priceVat,
        priceTotal: o.priceTotal,
        refundReason: p.refundReason,
      } as Partial<Refund>,
      items: o.items.map(
        (i) =>
          ({
            orderItemId: i.orderItemId,
            orderId: i.orderId,
            merchantId: i.merchantId,
            productId: i.productId,
            productName: i.productName,
            productLabel: i.productLabel,
            productDescription: i.productDescription,
            quantity: i.quantity,
            unit: i.unit,
            rowPriceNet: i.rowPriceNet,
            rowPriceVat: i.rowPriceVat,
            rowPriceTotal: i.rowPriceTotal,
            vatPercentage: i.vatPercentage,
            priceNet: i.priceNet,
            priceVat: i.priceVat,
            priceGross: i.priceGross,
            originalPriceNet: i.originalPriceNet,
            originalPriceVat: i.originalPriceVat,
            originalPriceGross: i.originalPriceGross,
          } as Partial<RefundItem>)
      ),
    })
    return res.data
  } catch (e) {
    throw new ExperienceFailure({
      code: 'failed-to-create-refund',
      message: `Failed to create refund`,
      source: e,
    })
  }
}

export const confirmRefundAdmin = async (p: {
  refundId: string
}): Promise<Refund> => {
  const { refundId } = p
  const url = `${getBackendUrl()}/refund-admin/confirm`
  try {
    const res = await axios.post(url, undefined, {
      params: {
        refundId,
      },
    })
    return res.data
  } catch (e) {
    if (e.response?.status === 400) {
      throw new ExperienceError({
        code: 'refund-validation-failed',
        message: `refund ${refundId} must be a draft`,
        responseStatus: StatusCode.BadRequest,
        logLevel: 'info',
      })
    }
    if (e.response?.status === 404) {
      throw new ExperienceError({
        code: 'refund-not-found',
        message: `refund ${refundId} not found`,
        responseStatus: StatusCode.NotFound,
        logLevel: 'info',
      })
    }
    throw new ExperienceFailure({
      code: 'failed-to-confirm-refund',
      message: `Failed to confirm refund ${refundId}`,
      source: e,
    })
  }
}

export const getRefundAdmin = async (p: {
  refundId: string
}): Promise<RefundAggregate> => {
  const { refundId } = p
  const url = `${getBackendUrl()}/refund-admin/get-by-refund-id`
  try {
    const res = await axios.get(url, { params: { refundId } })
    return res.data
  } catch (e) {
    if (e.response?.status === 404) {
      throw new ExperienceError({
        code: 'refund-not-found',
        message: `refund ${refundId} not found`,
        responseStatus: StatusCode.NotFound,
        logLevel: 'info',
      })
    }
    throw new ExperienceFailure({
      code: 'failed-to-get-refund',
      message: `Failed to get refund ${refundId}`,
      source: e,
    })
  }
}

export const getRefundsByOrderAdmin = async (p: {
  orderId: string
}): Promise<RefundAggregate[]> => {
  const { orderId } = p
  const url = `${getBackendUrl()}/refund-admin/get-by-order-id`
  try {
    const res = await axios.get(url, { params: { orderId } })
    return res.data
  } catch (e) {
    throw new ExperienceFailure({
      code: 'failed-to-get-refunds',
      message: `Failed to get refunds with order id ${orderId}`,
      source: e,
    })
  }
}
