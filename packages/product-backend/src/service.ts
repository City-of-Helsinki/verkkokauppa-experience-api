import axios from 'axios'
import type { ProductAccounting } from './types/ProductAccounting'
export type { ProductAccounting } from './types/ProductAccounting'
import {
  ProductNotFoundError,
  GetProductFailure,
  CreateProductAccountingFailure,
} from './errors'

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

type ProductAccountingBackendResponse = {
  productId: string
  vatCode: string
  internalOrder: string
  profitCenter: string
  project: string
  operationArea: string
}

export const createProductAccounting = async (p: {
  productAccounting: ProductAccounting
}): Promise<ProductAccountingBackendResponse> => {
  const { productAccounting } = p
  if (!process.env.PRODUCT_BACKEND_URL) {
    throw new Error('No product backend URL set')
  }

  const url =
    `${process.env.PRODUCT_BACKEND_URL}/product/` +
    productAccounting.productId +
    '/accounting'
  try {
    const result = await axios.post<ProductAccountingBackendResponse>(
      url,
      productAccounting
    )
    return result.data
  } catch (e) {
    throw new CreateProductAccountingFailure(e)
  }
}