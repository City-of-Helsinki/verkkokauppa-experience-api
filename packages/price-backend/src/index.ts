import axios, { AxiosResponse } from 'axios'
import type { CommonBackendHandler } from '@verkkokauppa/types'

type PriceBackendOriginals = {
  [key: string]: any
}

type PriceBackendResponse = {
  id: string
  price: number
  original: PriceBackendOriginals
}

export const getPrice: CommonBackendHandler<AxiosResponse<PriceBackendResponse>> = async (p) => {
  const { id } = p
  if (!process.env.PRICE_BACKEND_URL) {
    throw new Error('No price backend URL set')
  }
  const url = `${process.env.PRICE_BACKEND_URL}/price/get?productId=${id}`
  return axios.get<PriceBackendResponse>(url)
}
