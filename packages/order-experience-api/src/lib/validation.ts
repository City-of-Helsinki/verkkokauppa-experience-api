import type {
  OrderCustomer,
  OrderItemRequest,
} from '@verkkokauppa/order-backend'
import * as yup from 'yup'

export const itemsSchema = yup.array().of(
  yup.object().shape({
    productId: yup.string().required(),
    productName: yup.string().required(),
    quantity: yup.number().required(),
    unit: yup.string().required(),
    rowPriceNet: yup.string().required(),
    rowPriceVat: yup.string().required(),
    rowPriceTotal: yup.string().required(),
    priceNet: yup.string().required(),
    priceGross: yup.string().required(),
    priceVat: yup.string().required(),
    vatPercentage: yup.string().required(),
    invoicingDate: yup.date().notRequired().default(undefined),
  })
)

export const validateItems = (p: {
  items: OrderItemRequest[]
}): Promise<boolean> => {
  const { items } = p
  return itemsSchema.isValid(items)
}

export const customerSchema = yup.object().shape({
  firstName: yup.string().required(),
  lastName: yup.string().required(),
  email: yup.string().email().required(),
  phone: yup
    .string()
    .matches(/^\+(?:[0-9] ?){6,14}[0-9]$/, { excludeEmptyString: true })
    .trim()
    .ensure(),
})

export const invoiceSchema = yup.object().shape({
  businessId: yup.string().required(),
  name: yup.string().required(),
  address: yup.string().required(),
  postcode: yup.string().required(),
  city: yup.string().required(),
  ovtId: yup.string().notRequired(),
})

export const validateCustomer = (p: OrderCustomer): Promise<boolean> => {
  return customerSchema.isValid(p)
}

export const paymentFiltersSchema = yup.array().of(
  yup.object().shape({
    namespace: yup.string().required(),
    filterType: yup.string().required(),
    value: yup.string().required(),
  })
)
