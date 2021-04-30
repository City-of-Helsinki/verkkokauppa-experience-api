import axios from 'axios'

export interface CartItem {
  cartItemId: string
  cartId: string
  productId: string
  quantity: number
  unit: string
}
export interface Cart {
  cartId: string
  namespace: string
  user?: string
  createdAt: string
  items: CartItem[]
  cartTotals?: CartTotals
}

interface CartItemRequest {
  productId: string
  quantity: number
}

interface CartBackendResponse {
  cartId: string
  namespace: string
  user?: string
  createdAt: string
}
type CartWithItemsBackendResponse = {
  cart: CartBackendResponse
  items: CartItem[]
}

interface CartRowTotal {
  cartItemId: string
  netValue: number
  grossValue: number
  vatValue: number
  vatPercentage: number
}
export interface CartTotals {
  cartId: string
  netValue: number
  grossValue: number
  vatValue: number
  rowTotals: CartRowTotal[]
}
type CartWithTotalsBackendResponse = Cart & {
  cartTotals: CartTotals
}

export const createCart = async (p: {
  namespace: string
  user: string
}): Promise<Cart> => {
  const { namespace, user } = p
  if (!process.env.CART_BACKEND_URL) {
    throw new Error('No cart backend URL set')
  }
  const url = `${process.env.CART_BACKEND_URL}/cart/create?namespace=${namespace}&user=${user}`
  const result = await axios.get<CartBackendResponse>(url)
  return { ...result.data, items: [] }
}

export const getCart = async (p: { cartId: string }): Promise<Cart> => {
  const { cartId } = p
  if (!process.env.CART_BACKEND_URL) {
    throw new Error('No cart backend URL set')
  }
  const url = `${process.env.CART_BACKEND_URL}/cart/getCartWithItems?cartId=${cartId}`
  const result = await axios.get<CartWithItemsBackendResponse>(url)
  return { ...result.data.cart, items: result.data.items }
}

export const findCart = async (p: {
  namespace: string
  user: string
}): Promise<Cart> => {
  const { namespace, user } = p
  if (!process.env.CART_BACKEND_URL) {
    throw new Error('No cart backend URL set')
  }
  const url = `${process.env.CART_BACKEND_URL}/cart/getByNames?namespace=${namespace}&user=${user}`
  const result = await axios.get<CartBackendResponse>(url)
  return { ...result.data, items: [] }
}

export const addItemToCart = async (p: {
  cartId: string
  productId: string
  quantity: number
}): Promise<Cart> => {
  const { cartId, productId } = p
  if (!process.env.CART_BACKEND_URL) {
    throw new Error('No cart backend URL set')
  }
  const url = `${process.env.CART_BACKEND_URL}/cart/addItem?cartId=${cartId}&productId=${productId}`
  const result = await axios.get<CartWithItemsBackendResponse>(url)
  return { ...result.data.cart, items: result.data.items }
}

export const removeItemFromCart = async (p: {
  cartId: string
  productId: string
}): Promise<Cart> => {
  const { cartId, productId } = p
  if (!process.env.CART_BACKEND_URL) {
    throw new Error('No cart backend URL set')
  }
  const url = `${process.env.CART_BACKEND_URL}/cart/removeItem?cartId=${cartId}&productId=${productId}`
  const result = await axios.get<CartWithItemsBackendResponse>(url)
  return { ...result.data.cart, items: result.data.items }
}
export const createCartWithItems = async (p: {
  namespace: string
  user: string
  items: CartItemRequest[]
}): Promise<Cart> => {
  const { items } = p
  if (!process.env.CART_BACKEND_URL) {
    throw new Error('No cart backend URL set')
  }
  const { cartId } = await createCart(p)
  const itemResults = await Promise.all(
    items.map((item) => addItemToCart({ cartId, ...item }))
  )
  const lastItem = itemResults[itemResults.length - 1]
  if (lastItem === undefined) {
    throw new Error('Cannot add item to cart while creating cart')
  }
  return lastItem
}

export const updateCartTotals = async (p: {
  cartId: string
  cartTotals: CartTotals
}): Promise<Cart> => {
  const { cartId, cartTotals } = p
  if (!process.env.CART_BACKEND_URL) {
    throw new Error('No cart backend URL set')
  }
  const url = `${process.env.CART_BACKEND_URL}/cart/totals?cartId=${cartId}`
  const result = await axios.post<CartWithTotalsBackendResponse>(
    url,
    cartTotals
  )
  return result.data
}
