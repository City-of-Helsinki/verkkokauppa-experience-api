import axios from 'axios'
import { SendOrderConfirmationEmailFailure } from '../../errors'
import { createEmailTemplate } from '../create/service'
import type {
  HbsTemplateFiles,
  Order,
  OrderConfirmationEmailParameters,
  OrderItemMeta,
} from '../create/types'

function isMessageBackendUrlSet() {
  if (!process.env.MESSAGE_BACKEND_URL) {
    throw new Error('No message backend URL set')
  }
}

export function parseOrderMetas(order: Order) {
  order.items.forEach((orderItem) => {
    orderItem.meta = parseOrderItemMetaVisibilityAndOrdinal(
      orderItem.meta || undefined
    )
  })
}

export function parseOrderItemMetaVisibilityAndOrdinal(
  metaItem: OrderItemMeta[] | undefined
) {
  if (!Array.isArray(metaItem)) {
    return []
  }

  let metaItemsOrdinal: OrderItemMeta[] = []
  let metaItemsNoOrdinal: OrderItemMeta[] = []

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
    throw new SendOrderConfirmationEmailFailure(e)
  }
}

export const sendEmailToCustomer = async (p: {
  order: Order
  fileName: HbsTemplateFiles
  sendTo: string
  emailHeader: string
}): Promise<any> => {
  const { order, fileName } = p
  // Reorder metas to show in correct order using ordinal etc.
  parseOrderMetas(order)
  const created = await createEmailTemplate<OrderConfirmationEmailParameters>({
    fileName: fileName,
    templateParams: { order: order },
  })

  return sendEmail({
    id: order.orderId,
    receiver: p.sendTo,
    header: p.emailHeader,
    body: created.template,
    attachments: {},
  })
}
