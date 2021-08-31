import axios from 'axios'
import {
  AddItemToCartFailure,
  CartNotFoundError,
  ClearCartFailure,
  CreateCartFailure,
  CreateCartWithItemsFailure,
  EditItemInCartFailure,
  FindCartFailure,
  GetCartFailure,
  RemoveItemFromCartFailure,
  UpdateCartTotalsFailure,
} from './errors'

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
  user: string
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
  user: string
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
  const url = `${process.env.CART_BACKEND_URL}/cart/create`
  try {
    const result = await axios.get<CartBackendResponse>(url, {
      params: { namespace, user },
    })
    return { ...result.data, items: [] }
  } catch (e) {
    throw new CreateCartFailure(e)
  }
}

export const getCart = async (p: { cartId: string }): Promise<Cart> => {
  const { cartId } = p
  if (!process.env.CART_BACKEND_URL) {
    throw new Error('No cart backend URL set')
  }
  const url = `${process.env.CART_BACKEND_URL}/cart/getCartWithItems`
  try {
    const result = await axios.get<CartWithItemsBackendResponse>(url, {
      params: { cartId },
    })
    return { ...result.data.cart, items: result.data.items }
  } catch (e) {
    throw new GetCartFailure(e)
  }
}

export const findCart = async (p: {
  namespace: string
  user: string
}): Promise<Cart> => {
  const { namespace, user } = p
  if (!process.env.CART_BACKEND_URL) {
    throw new Error('No cart backend URL set')
  }
  const url = `${process.env.CART_BACKEND_URL}/cart/getByNames`
  try {
    const result = await axios.get<CartBackendResponse>(url, {
      params: { namespace, user },
    })
    return { ...result.data, items: [] }
  } catch (e) {
    if (e.response?.status === 404) {
      throw new CartNotFoundError()
    }
    throw new FindCartFailure(e)
  }
}

export const addItemToCart = async (p: {
  cartId: string
  productId: string
  quantity: number
}): Promise<Cart> => {
  const { cartId, productId, quantity } = p
  if (!process.env.CART_BACKEND_URL) {
    throw new Error('No cart backend URL set')
  }
  const url = `${process.env.CART_BACKEND_URL}/cart/addItem`
  try {
    const result = await axios.get<CartWithItemsBackendResponse>(url, {
      params: { cartId, productId, quantity },
    })
    return { ...result.data.cart, items: result.data.items }
  } catch (e) {
    throw new AddItemToCartFailure(e)
  }
}

export const editItemInCart = async (p: {
  cartId: string
  productId: string
  quantity: number
}): Promise<Cart> => {
  const { cartId, productId, quantity } = p
  if (!process.env.CART_BACKEND_URL) {
    throw new Error('No cart backend URL set')
  }
  const url = `${process.env.CART_BACKEND_URL}/cart/editItem`
  try {
    const result = await axios.get<CartWithItemsBackendResponse>(url, {
      params: { cartId, productId, quantity },
    })
    return { ...result.data.cart, items: result.data.items }
  } catch (e) {
    throw new EditItemInCartFailure(e)
  }
}

export const removeItemFromCart = async (p: {
  cartId: string
  productId: string
}): Promise<Cart> => {
  const { cartId, productId } = p
  if (!process.env.CART_BACKEND_URL) {
    throw new Error('No cart backend URL set')
  }
  const url = `${process.env.CART_BACKEND_URL}/cart/removeItem`
  try {
    const result = await axios.get<CartWithItemsBackendResponse>(url, {
      params: { cartId, productId },
    })
    return { ...result.data.cart, items: result.data.items }
  } catch (e) {
    throw new RemoveItemFromCartFailure(e)
  }
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
  // FIXME ?
  const lastItem = itemResults[itemResults.length - 1]
  if (lastItem === undefined) {
    throw new CreateCartWithItemsFailure(
      new Error('Cannot add item to cart while creating cart')
    )
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
  const url = `${process.env.CART_BACKEND_URL}/cart/totals`
  try {
    const result = await axios.post<CartWithTotalsBackendResponse>(
      url,
      cartTotals,
      { params: { cartId } }
    )
    return result.data
  } catch (e) {
    throw new UpdateCartTotalsFailure(e)
  }
}

export const clearCart = async (p: {
  namespace: string
  user: string
}): Promise<Cart> => {
  const { namespace, user } = p
  if (!process.env.CART_BACKEND_URL) {
    throw new Error('No cart backend URL set')
  }
  const url = `${process.env.CART_BACKEND_URL}/cart/clear`
  try {
    const result = await axios.get<CartBackendResponse>(url, {
      params: { namespace, user },
    })
    return { ...result.data, items: [] }
  } catch (e) {
    throw new ClearCartFailure(e)
  }
}
