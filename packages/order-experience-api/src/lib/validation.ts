import type {
  OrderCustomer,
  OrderItemRequest,
} from '@verkkokauppa/order-backend'
import * as yup from 'yup'

export const validateItems = (p: {
  items: OrderItemRequest[]
}): Promise<boolean> => {
  const itemSchema = yup.object().shape({
    productId: yup.string().required(),
    productName: yup.string().required(),
    quantity: yup.number().required(),
    unit: yup.string().required(),
    rowPriceNet: yup.string().required(),
    rowPriceVat: yup.string().required(),
    rowPriceTotal: yup.string().required(),
  })
  const schema = yup.array().of(itemSchema)
  const { items } = p
  return schema.isValid(items)
}

export const validateCustomer = (p: OrderCustomer): Promise<boolean> => {
  const customerSchema = yup.object().shape({
    firstName: yup.string().required(),
    lastName: yup.string().required(),
    email: yup.string().email().required(),
    phone: yup
      .string()
      .matches(/^\+(?:[0-9] ?){6,14}[0-9]$/)
      .required(),
  })
  return customerSchema.isValid(p)
}
