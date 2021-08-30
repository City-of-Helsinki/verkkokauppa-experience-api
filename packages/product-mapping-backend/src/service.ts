import axios from 'axios'
import {
  CreateProductMappingFailure,
  GetProductMappingFailure,
  ProductMappingNotFound,
} from './errors'

interface ProductMappingRequest {
  namespace: string
  namespaceEntityId: string
}

type ProductMappingBackendResponse = ProductMappingRequest & {
  productId: string
}
const checkBackendUrlExists = () => {
  if (!process.env.PRODUCT_MAPPING_BACKEND_URL) {
    throw new Error('No product mapping backend URL set')
  }
}

export const getProductMapping = async (p: {
  productId: string
}): Promise<ProductMappingBackendResponse> => {
  checkBackendUrlExists()

  const { productId } = p
  const url = `${process.env.PRODUCT_MAPPING_BACKEND_URL}/productmapping/get`
  try {
    const result = await axios.get<ProductMappingBackendResponse>(url, {
      params: { productId },
    })
    return result.data
  } catch (e) {
    if (e.response?.status === 404) {
      throw new ProductMappingNotFound()
    }
    throw new GetProductMappingFailure(e)
  }
}

export const createProductMapping = async (
  p: ProductMappingRequest
): Promise<ProductMappingBackendResponse> => {
  checkBackendUrlExists()

  const { namespace, namespaceEntityId } = p
  const url = `${process.env.PRODUCT_MAPPING_BACKEND_URL}/productmapping/create`
  try {
    const result = await axios.get<ProductMappingBackendResponse>(url, {
      params: { namespace, namespaceEntityId },
    })
    return result.data
  } catch (e) {
    throw new CreateProductMappingFailure(e)
  }
}
