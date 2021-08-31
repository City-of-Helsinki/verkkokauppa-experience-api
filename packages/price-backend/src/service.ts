import axios from 'axios'
import { PriceNotFoundError, GetPriceFailure } from './errors'

type PriceBackendResponse = {
  productId: string
  price: string
  original: {
    productId: string
    netValue: string
    vatPercentage: string
    grossValue: string
    vatValue: string
    id: string
  }
}

export const getPrice = async (p: {
  productId: string
}): Promise<PriceBackendResponse> => {
  const { productId } = p
  if (!process.env.PRICE_BACKEND_URL) {
    throw new Error('No price backend URL set')
  }
  const url = `${process.env.PRICE_BACKEND_URL}/price/get`
  try {
    const result = await axios.get<PriceBackendResponse>(url, {
      params: { productId },
    })
    return result.data
  } catch (e) {
    if (e.response?.status === 404) {
      throw new PriceNotFoundError(productId)
    }
    throw new GetPriceFailure(productId, e)
  }
}
