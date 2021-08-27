import axios from 'axios'
import type { MessageSent } from './types'
import type { SendType } from "./types";

function getMessageSendUrl(sendType: SendType) {
  if (sendType !== "email") {
    throw new Error("Send type is not supported");
  }
  return `${ process.env.ORDER_BACKEND_URL }/order/createWithItems`;
}

export const createMessageToOrder = async (p: {
  namespace: string
  user: string
  receiver: string
  orderId: string
  sendType: SendType
}): Promise<MessageSent> => {
  const { namespace, receiver, user, sendType, orderId } = p
  if (!process.env.ORDER_BACKEND_URL) {
    throw new Error('No order backend URL set')
  }
  const requestDto = {
    message: {
      namespace,
      user,
      receiver,
      sendType,
      orderId
    }
  }

  const url = getMessageSendUrl(sendType);

  const result = await axios.post<MessageSent>(
    url,
    requestDto
  )
  return result.data
}
