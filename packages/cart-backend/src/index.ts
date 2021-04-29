import axios from 'axios'

interface CartItem {
  cartItemId: string
  cartId: string
  productId: string
  quantity: number
  unit: string
}
interface CartBackendResponse {
  cartId: string
  namespace: string
  user?: string
  createdAt: string
}
interface CartWithItemsBackendResponse {
  cart: CartBackendResponse
  items: CartItem[]
}

export const createCart = async (p: {
  namespace: string
  user?: string
}): Promise<CartBackendResponse> => {
  const { namespace, user } = p
  if (!process.env.CART_BACKEND_URL) {
    throw new Error('No cart backend URL set')
  }
  const url = `${process.env.CART_BACKEND_URL}/cart/create?namespace=${namespace}&user=${user}`
  const result = await axios.get<CartBackendResponse>(url)
  return result.data
}

export const getCart = async (p: {
  cartId: string
}): Promise<CartBackendResponse> => {
  const { cartId } = p
  if (!process.env.CART_BACKEND_URL) {
    throw new Error('No cart backend URL set')
  }
  const url = `${process.env.CART_BACKEND_URL}/cart/get?cartId=${cartId}`
  const result = await axios.get<CartBackendResponse>(url)
  return result.data
}

export const addItemToCart = async (p: {
  cartId: string
  productId: string
  quantity: number
}): Promise<CartWithItemsBackendResponse> => {
  const { cartId, productId } = p
  if (!process.env.CART_BACKEND_URL) {
    throw new Error('No cart backend URL set')
  }
  const url = `${process.env.CART_BACKEND_URL}/cart/addItem?cartId=${cartId}&productId=${productId}`
  const result = await axios.get<CartWithItemsBackendResponse>(url)
  return result.data
}

export const removeItemFromCart = async (p: {
  cartId: string
  productId: string
}): Promise<CartWithItemsBackendResponse> => {
  const { cartId, productId } = p
  if (!process.env.CART_BACKEND_URL) {
    throw new Error('No cart backend URL set')
  }
  const url = `${process.env.CART_BACKEND_URL}/cart/removeItem?cartId=${cartId}&productId=${productId}`
  const result = await axios.get<CartWithItemsBackendResponse>(url)
  return result.data
}
