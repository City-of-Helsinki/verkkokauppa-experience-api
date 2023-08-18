import axios from 'axios'
import type { ProductAccounting } from './types/ProductAccounting'
export type { ProductAccounting } from './types/ProductAccounting'
import {
  ProductNotFoundError,
  GetProductFailure,
  CreateProductAccountingFailure,
  GetProductAccountingFailure,
  ProductAccountingNotFoundError,
} from './errors'
import { ExperienceFailure } from '@verkkokauppa/core'

type ProductBackendResponse = {
  id: string
  name: string
  original: {
    [key: string]: any
  }
}

export const getProduct = async (p: {
  productId: string
}): Promise<ProductBackendResponse> => {
  const { productId } = p
  if (!process.env.PRODUCT_BACKEND_URL) {
    throw new Error('No product backend URL set')
  }
  const url = `${process.env.PRODUCT_BACKEND_URL}/product/get`
  try {
    const result = await axios.get<ProductBackendResponse>(url, {
      params: { productId },
    })
    return result.data
  } catch (e) {
    if (e.response?.status === 404) {
      throw new ProductNotFoundError(productId)
    }
    throw new GetProductFailure(productId, e)
  }
}

type ProductInvoicing = {
  productId: string
  salesOrg: string
  salesOffice: string
  material: string
  orderType: string
}

export const createProductInvoicing = async (p: {
  productInvoicing: ProductInvoicing
}): Promise<ProductInvoicing> => {
  const { productInvoicing } = p

  if (!process.env.PRODUCT_BACKEND_URL) {
    throw new Error('No product backend URL set')
  }

  const url = `${process.env.PRODUCT_BACKEND_URL}/product/invoicing`
  try {
    const result = await axios.post(url, productInvoicing)
    return result.data
  } catch (e) {
    throw new ExperienceFailure({
      code: 'failed-to-create-product-invoicing',
      message: 'Failed to create product invoicing',
      source: e,
    })
  }
}

export const getProductInvoicings = async (p: {
  productIds: string[]
}): Promise<(ProductInvoicing | null)[]> => {
  const { productIds } = p
  if (!process.env.PRODUCT_BACKEND_URL) {
    throw new Error('No product backend URL set')
  }

  const url = `${process.env.PRODUCT_BACKEND_URL}/product/invoicing/list`
  try {
    const result = await axios.post(url, productIds)
    return result.data
  } catch (e) {
    throw new ExperienceFailure({
      code: 'failed-to-get-product-invoicings',
      message: 'Failed to get product invoicings',
      source: e,
    })
  }
}

export const createProductAccounting = async (p: {
  productAccounting: ProductAccounting
}): Promise<ProductAccounting> => {
  const { productAccounting } = p
  if (!process.env.PRODUCT_BACKEND_URL) {
    throw new Error('No product backend URL set')
  }

  const url =
    `${process.env.PRODUCT_BACKEND_URL}/product/` +
    productAccounting.productId +
    '/accounting'
  try {
    const result = await axios.post<ProductAccounting>(url, productAccounting)
    return result.data
  } catch (e) {
    throw new CreateProductAccountingFailure(e)
  }
}

export const getProductAccountingBatch = async (p: {
  productIds: string[]
}): Promise<ProductAccounting[]> => {
  const { productIds } = p
  if (!process.env.PRODUCT_BACKEND_URL) {
    throw new Error('No product backend URL set')
  }

  const url = `${process.env.PRODUCT_BACKEND_URL}/product/accounting/list`
  try {
    const result = await axios.get<ProductAccounting[]>(url, {
      data: { productIds },
    })
    return result.data
  } catch (e) {
    if (e.response?.status === 404) {
      throw new ProductAccountingNotFoundError(productIds.join(','))
    }
    throw new GetProductAccountingFailure(productIds.join(','), e)
  }
}
