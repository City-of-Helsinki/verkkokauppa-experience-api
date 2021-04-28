import axios, { AxiosResponse } from 'axios'
import type {
  CommonBackendHandler,
  CommonBackendOriginals,
  CommonBackendRequest,
} from '@verkkokauppa/types'

type ProductBackendResponse = {
  id: string
  name: string
  [key: string]: any
  original: CommonBackendOriginals
}

export const getProduct: CommonBackendHandler<
  CommonBackendRequest,
  AxiosResponse<ProductBackendResponse>
> = async (p) => {
  const { id } = p
  if (!process.env.PRODUCT_BACKEND_URL) {
    throw new Error('No product backend URL set')
  }
  const url = `${process.env.PRODUCT_BACKEND_URL}/product/get?productId=${id}`
  return axios.get<ProductBackendResponse>(url)
}
