import axios from 'axios'
import type { Order, Payment } from '../types'
import {
  CreateRefundPaymentFromRefundFailure,
  RefundGatewayValidationError,
  RefundPaymentValidationError,
} from './errors'
import { RefundGateway } from '../enums'

import { createMethodPartFromGateway } from '../service'
import type { RefundAggregate, RefundPayment } from './types'

const allowedRefundGateways = [RefundGateway.PAYTRAIL.toString()]

export const createRefundPaymentFromRefund = async (parameters: {
  order: Order
  payment: Payment
  refund: RefundAggregate
  gateway: string
  merchantId: string | null
}): Promise<RefundPayment> => {
  const { order, payment, gateway, merchantId, refund } = parameters
  if (!process.env.PAYMENT_BACKEND_URL) {
    throw new Error('No payment API backend URL set')
  }

  if (!allowedRefundGateways.includes(gateway)) {
    throw new RefundGatewayValidationError(
      'payment-gateway-validation-failed',
      'payment gateway must be one of allowed refund gateways'
    )
  }
  const refundMethodPart = createMethodPartFromGateway(gateway)

  const url = `${process.env.PAYMENT_BACKEND_URL}/refund/${refundMethodPart}/createFromRefund`
  const dto = {
    payment,
    refund,
    order: {
      order: {
        ...order,
        customerFirstName: order.customer?.firstName,
        customerLastName: order.customer?.lastName,
        customerEmail: order.customer?.email,
      },
      items: order.items,
    },
    merchantId,
  }
  try {
    const result = await axios.post<RefundPayment>(url, dto)

    return result.data
  } catch (e) {
    if (e.response?.status === 403) {
      throw new RefundPaymentValidationError(
        'refund-payment-validation-failed',
        'order status must be confirmed'
      )
    }
    throw new CreateRefundPaymentFromRefundFailure(e)
  }
}
