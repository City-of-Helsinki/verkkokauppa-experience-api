import axios from 'axios'

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
  const url = `${process.env.PRODUCT_BACKEND_URL}/product/get?productId=${productId}`
  const result = await axios.get<ProductBackendResponse>(url)
  return result.data
}
