import axios from 'axios'
import {
  GeneralSendEmailFailure,
  SendOrderConfirmationEmailFailure,
  SendSubscriptionContractEmailFailure,
  SendSubscriptionPaymentFailedEmailToCustomer,
} from '../../errors'
import { createEmailTemplate } from '../create/service'

import type {
  HbsTemplateFiles,
  Order,
  OrderConfirmationEmailParameters,
  OrderItemMeta,
  OrderMerchant,
  Payment,
  Refund,
  Subscription,
  SubscriptionCardExpiredEmailParameters,
  SubscriptionItemMeta,
  SubscriptionPaymentFailedEmailParameters,
  VatTable,
} from '../create/types'
import { ExperienceError, logger, StatusCode } from '@verkkokauppa/core'

function isMessageBackendUrlSet() {
  if (!process.env.MESSAGE_BACKEND_URL) {
    throw new Error('No message backend URL set')
  }
}

export function parseOrderVat(order: Order) {
  let vatTable = {} as VatTable

  order.items.forEach((orderItem) => {
    if (!vatTable[orderItem.vatPercentage]) {
      vatTable[orderItem.vatPercentage] = 0
    }
    if (orderItem.rowPriceVat) {
      vatTable[orderItem.vatPercentage] += +orderItem.rowPriceVat
    }
  })

  return vatTable
}

export function parseOrderMetas(order: Order) {
  order.items.forEach((orderItem) => {
    orderItem.meta = parseItemMetaVisibilityAndOrdinal(
      orderItem.meta || undefined
    )
  })
}

export function parseSubscriptionMetas(subscription: Subscription) {
  subscription.meta = parseItemMetaVisibilityAndOrdinal(
    subscription.meta || undefined
  )
}

export function parseItemMetaVisibilityAndOrdinal(
  metaItem: (SubscriptionItemMeta[] & OrderItemMeta[]) | undefined
) {
  if (!Array.isArray(metaItem)) {
    return []
  }

  let metaItemsOrdinal: SubscriptionItemMeta[] & OrderItemMeta[] = []
  let metaItemsNoOrdinal: SubscriptionItemMeta[] & OrderItemMeta[] = []

  metaItem
    .filter(
      (meta) => meta.visibleInCheckout === 'true' || !meta.visibleInCheckout
    )
    .forEach((orderItem) => {
      // If the metadata is marked for display on the receipt (visibleInCheckout = true)
      // and no metadata value is specified for the label field
      // at the checkout, only the value is displayed
      orderItem.key = '' // Key should not be visible in emails
      // Metadata is arranged at the receipt based on the ordinal number if a value is given
      if (orderItem.ordinal) {
        metaItemsOrdinal[parseInt(orderItem.ordinal)] = orderItem
      } else {
        metaItemsNoOrdinal.push(orderItem)
      }
    })
  return [...metaItemsOrdinal, ...metaItemsNoOrdinal]
}

export const sendEmail = async (p: {
  id: string
  sender?: string
  receiver: string
  header: string
  body: string
  attachments: { [filename: string]: string }
  emailType: HbsTemplateFiles
}): Promise<void> => {
  const { id, sender, receiver, header, body, attachments } = p
  isMessageBackendUrlSet()

  const url = `${process.env.MESSAGE_BACKEND_URL}/message/send/email`
  try {
    const res = await axios.post(url, {
      id,
      sender,
      receiver,
      header,
      body,
      attachments,
    })
    return res.data
  } catch (e) {
    switch (p.emailType) {
      case 'orderConfirmation':
        throw new SendOrderConfirmationEmailFailure(e)
      case 'subscriptionPaymentFailed':
        throw new SendSubscriptionPaymentFailedEmailToCustomer(e)
      case 'subscriptionContract':
        throw new SendSubscriptionContractEmailFailure(e)
      default:
        throw new GeneralSendEmailFailure(e)
    }
  }
}

export const sendOrderConfirmationEmailToCustomer = async (p: {
  order: Order
  sendTo: string
  emailHeader: string
  attachments?: { [filename: string]: string }
}): Promise<any> => {
  const emailType = 'orderConfirmation'
  const { order } = p
  // Reorder metas to show in correct order using ordinal etc.
  parseOrderMetas(order)
  const vatTable = parseOrderVat(order)

  const created = await createEmailTemplate<OrderConfirmationEmailParameters>({
    fileName: emailType,
    templateParams: { order: order, vatTable: vatTable },
  })

  return sendEmail({
    id: order.orderId,
    receiver: p.sendTo,
    header: p.emailHeader,
    body: created.template,
    attachments: p.attachments ?? {},
    emailType: emailType,
  })
}

export const sendSubscriptionPaymentFailedEmailToCustomer = async (p: {
  order: Order
  subscription: Subscription
  sendTo: string
  emailHeader: string
}): Promise<any> => {
  const emailType = 'subscriptionPaymentFailed'
  const { order, subscription } = p
  // Reorder metas to show in correct order using ordinal etc.
  parseOrderMetas(order)
  parseSubscriptionMetas(subscription)

  const created = await createEmailTemplate<SubscriptionPaymentFailedEmailParameters>(
    {
      fileName: emailType,
      templateParams: { order: order, subscription: subscription },
    }
  )

  return sendEmail({
    id: order.orderId,
    receiver: p.sendTo,
    header: p.emailHeader,
    body: created.template,
    attachments: {},
    emailType: emailType,
  })
}

export const sendSubscriptionCardExpiredEmailToCustomer = async (p: {
  order: Order
  subscription: Subscription
  sendTo: string
  emailHeader: string
}): Promise<any> => {
  const emailType = 'subscriptionCardExpired'
  const { order, subscription } = p
  // Reorder metas to show in correct order using ordinal etc.
  parseOrderMetas(order)
  parseSubscriptionMetas(subscription)

  const created = await createEmailTemplate<SubscriptionCardExpiredEmailParameters>(
    {
      fileName: emailType,
      templateParams: { order: order, subscription: subscription },
    }
  )

  return sendEmail({
    id: order.orderId,
    receiver: p.sendTo,
    header: p.emailHeader,
    body: created.template,
    attachments: {},
    emailType: emailType,
  })
}

export const sendErrorNotification = async (p: {
  message: string
  cause: string
  header: string
}): Promise<void> => {
  const { message, cause, header } = p
  isMessageBackendUrlSet()
  const url = `${process.env.MESSAGE_BACKEND_URL}/message/send/errorNotification`
  try {
    await axios.post(url, { message, cause, header })
    return
  } catch (e) {
    logger.error('Failed to send error notification. Error: ' + e)
  }
}

export const sendErrorNotificationWithOrderData = async (p: {
  orderId: string
  message: string
  cause: string
  header: string
}): Promise<void> => {
  const { orderId, message, cause, header } = p
  isMessageBackendUrlSet()
  const url = `${process.env.ORDER_BACKEND_URL}/notification/sendErrorNotificationWithOrder/${orderId}`
  try {
    await axios.post(url, { message, cause, header })
    return
  } catch (e) {
    logger.error(
      'Failed to send error notification with order data. Error: ' + e
    )
  }
}

export const sendRefundConfirmationEmail = async (p: {
  order: Order
  refund: Refund
  merchant: OrderMerchant
  payment: Pick<Payment, 'total'>
}) => {
  const { order, refund, merchant, payment } = p

  const vatTable = refund.items.reduce((table, item) => {
    if (!table[item.vatPercentage]) {
      table[item.vatPercentage] = 0
    }
    table[item.vatPercentage] += +item.rowPriceVat || 0
    return table
  }, {} as { [key: string]: number })

  const { template: email } = await createEmailTemplate({
    fileName: 'refundConfirmation',
    templateParams: {
      refund: {
        ...refund,
        items: refund.items.map((item) => ({
          ...item,
          meta: parseItemMetaVisibilityAndOrdinal(
            order.items.find((i) => i.orderItemId === item.orderItemId)?.meta
          ),
        })),
      },
      order,
      merchant,
      payment,
      vatTable,
    },
  })

  if (!order.customer?.email) {
    throw new ExperienceError({
      code: 'missing-customer-email',
      message: 'Refund order is missing customer email to send email to',
      responseStatus: StatusCode.BadRequest,
      logLevel: 'info',
    })
  }

  await sendEmail({
    id: refund.refund.refundId,
    receiver: order.customer.email,
    header: 'Vahvistus ja kuitti maksun palautuksesta',
    body: email,
    attachments: {},
    emailType: 'refundConfirmation',
  })
}
