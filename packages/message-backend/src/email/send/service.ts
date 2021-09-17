import axios from 'axios'
import { SendOrderConfirmationEmailFailure } from '../../errors'
import { createOrderConfirmationEmailTemplate } from '../create/service'
import type {
  HbsTemplateFiles,
  Order,
  OrderConfirmationEmailParameters,
} from '../create/types'

function isMessageBackendUrlSet() {
  if (!process.env.MESSAGE_BACKEND_URL) {
    throw new Error('No message backend URL set')
  }
}

export const sendEmailToCustomer = async (p: {
  order: Order
  fileName: HbsTemplateFiles
  sendTo: string
  emailHeader: string
}): Promise<any> => {
  isMessageBackendUrlSet()
  const { order, fileName } = p

  const created = await createOrderConfirmationEmailTemplate<OrderConfirmationEmailParameters>(
    {
      fileName: fileName,
      templateParams: { order: order },
    }
  )

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
