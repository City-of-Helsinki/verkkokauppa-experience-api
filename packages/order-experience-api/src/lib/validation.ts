import type { OrderItemRequest } from '@verkkokauppa/order-backend'
import * as yup from 'yup'

export const validateItems = (p: {
  items: OrderItemRequest[]
}): Promise<boolean> => {
  const itemSchema = yup.object().shape({
    productId: yup.string().required(),
    productName: yup.string().required(),
    quantity: yup.number().required(),
    unit: yup.string().required(),
    rowPriceNet: yup.number().required(),
    rowPriceVat: yup.number().required(),
    rowPriceTotal: yup.number().required(),
  })
  const schema = yup.array().of(itemSchema)
  const { items } = p
  return schema.isValid(items)
}
