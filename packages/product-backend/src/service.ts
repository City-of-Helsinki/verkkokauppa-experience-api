import axios from 'axios'
import type { ProductAccounting } from './types/ProductAccounting'
export type { ProductAccounting } from './types/ProductAccounting'
import {
  ProductNotFoundError,
  GetProductFailure,
  CreateProductAccountingFailure,
  GetProductAccountingFailure,
  ProductAccountingNotFoundError,
  productAccountingRequestValidationError,
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

export const createProductAccounting = async (p: {
  productAccounting: ProductAccounting
}): Promise<ProductAccounting> => {
  const { productAccounting } = p
  if (!process.env.PRODUCT_BACKEND_URL) {
    throw new Error('No product backend URL set')
  }
  // These values are required by SAP and need be provided
  if (
    !productAccounting.vatCode ||
    !productAccounting.companyCode ||
    !productAccounting.mainLedgerAccount
  ) {
    throw new productAccountingRequestValidationError()
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
