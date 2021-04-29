import axios from 'axios'

type PriceBackendResponse = {
  productId: string
  price: number
  original: {
    [key: string]: any
  }
}

export const getPrice = async (p: {
  productId: string
}): Promise<PriceBackendResponse> => {
  const { productId } = p
  if (!process.env.PRICE_BACKEND_URL) {
    throw new Error('No price backend URL set')
  }
  const url = `${process.env.PRICE_BACKEND_URL}/price/get?productId=${productId}`
  const result = await axios.get<PriceBackendResponse>(url)
  return result.data
}
