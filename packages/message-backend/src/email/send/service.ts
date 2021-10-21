import axios from 'axios'
import { SendOrderConfirmationEmailFailure } from '../../errors'
import { createOrderConfirmationEmailTemplate } from '../create/service'
import type {
  HbsTemplateFiles,
  Order,
  OrderConfirmationEmailParameters,
  OrderItemMeta,
} from '../create/types'
const fs = require('fs')

function isMessageBackendUrlSet() {
  if (!process.env.MESSAGE_BACKEND_URL) {
    throw new Error('No message backend URL set')
  }
}

export function parseOrderItemMetaVisibilityAndOrdinal(
  metaItem: OrderItemMeta[]
) {
  let metaItemsOrdinal: OrderItemMeta[] = []
  let metaItemsNoOrdinal: OrderItemMeta[] = []
  metaItem.forEach((orderItem) => {
    if (
      orderItem.visibleInCheckout === 'true' ||
      !orderItem.visibleInCheckout
    ) {
      // If the metadata is marked for display on the receipt (visibleInCheckout = true)
      // and no metadata value is specified for the label field
      // at the checkout, only the value is displayed
      if (orderItem.visibleInCheckout === 'true' && !orderItem.label) {
        orderItem.key = ''
      }
      // Metadata is arranged at the receipt based on the ordinal number if a value is given
      if (orderItem.ordinal) {
        metaItemsOrdinal[parseInt(orderItem.ordinal)] = orderItem
      } else {
        metaItemsNoOrdinal.push(orderItem)
      }
    }
  })
  return [...metaItemsOrdinal, ...metaItemsNoOrdinal]
}

export const sendEmailToCustomer = async (p: {
  order: Order
  fileName: HbsTemplateFiles
  sendTo: string
  emailHeader: string
}): Promise<any> => {
  isMessageBackendUrlSet()
  const { order, fileName } = p
  // Reorder metas to show in correct order using ordinal etc.
  order.meta = parseOrderItemMetaVisibilityAndOrdinal(order.meta || [])
  const created = await createOrderConfirmationEmailTemplate<OrderConfirmationEmailParameters>(
    {
      fileName: fileName,
      templateParams: { order: order },
    }
  )

  const writeToFile = true //TODO REMOVE!
  if (writeToFile) {
    try {
      fs.writeFileSync(
        'packages/message-backend/src/email/create/__snapshots__/orderConfirmation.html',
        created.template
      )
      //file written successfully
    } catch (err) {
      console.error(err)
    }
  }

  const url = `${process.env.MESSAGE_BACKEND_URL}/message/send/email`

  try {
    const result = await axios.post<any>(url, {
      orderId: order.orderId,
      receiver: p.sendTo,
      header: p.emailHeader,
      body: created.template,
    })
    return result.data
  } catch (e) {
    throw new SendOrderConfirmationEmailFailure(e)
  }
}
