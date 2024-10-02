import axios from 'axios'
import {
  CreateProductMappingFailure,
  GetProductMappingFailure,
  GetProductMappingsByNamespaceFailure,
  ProductMappingByNamespaceNotFound,
  ProductMappingNotFound,
} from './errors'

interface ProductMappingRequest {
  namespace: string
  namespaceEntityId: string
  merchantId: string
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

export const getProductMappingsByNamespace = async (p: {
  namespace: string
}): Promise<[ProductMappingBackendResponse]> => {
  checkBackendUrlExists()

  const { namespace } = p
  const url = `${process.env.PRODUCT_MAPPING_BACKEND_URL}/productmappings/get/namespace`
  try {
    const result = await axios.get<[ProductMappingBackendResponse]>(url, {
      params: { namespace },
    })
    return result.data
  } catch (e) {
    if (e.response?.status === 404) {
      throw new ProductMappingByNamespaceNotFound(namespace)
    }
    throw new GetProductMappingsByNamespaceFailure(e)
  }
}

export const createProductMapping = async (
  p: ProductMappingRequest
): Promise<ProductMappingBackendResponse> => {
  checkBackendUrlExists()

  const { namespace, namespaceEntityId, merchantId } = p
  const url = `${process.env.PRODUCT_MAPPING_BACKEND_URL}/productmapping/create`
  try {
    const result = await axios.get<ProductMappingBackendResponse>(url, {
      params: { namespace, namespaceEntityId, merchantId },
    })
    return result.data
  } catch (e) {
    throw new CreateProductMappingFailure(e)
  }
}
