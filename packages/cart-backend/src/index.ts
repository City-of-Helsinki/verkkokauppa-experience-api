import axios, { AxiosResponse } from 'axios'
import type {
  CommonBackendHandler,
  CartCreateBackendResponse,
  CartCreateBackendRequest,
  CommonBackendRequest,
  CartBackendResponse,
} from '@verkkokauppa/types'

export const createCart: CommonBackendHandler<
  CartCreateBackendRequest,
  AxiosResponse<CartCreateBackendResponse>
> = async (p) => {
  const { namespace, user } = p
  if (!process.env.CART_BACKEND_URL) {
    throw new Error('No cart backend URL set')
  }
  const url = `${process.env.CART_BACKEND_URL}/cart/create?namespace=${namespace}&user=${user}`
  return axios.get<CartCreateBackendResponse>(url)
}

export const getCart: CommonBackendHandler<
  CommonBackendRequest,
  AxiosResponse<CartBackendResponse>
> = async (p) => {
  const { id } = p
  if (!process.env.CART_BACKEND_URL) {
    throw new Error('No cart backend URL set')
  }
  const url = `${process.env.CART_BACKEND_URL}/cart/get?cartId=${id}`
  return axios.get<CartBackendResponse>(url)
}
