import type { Cart, CartItem, CartTotals } from '@verkkokauppa/cart-backend'
import { getPrice } from '@verkkokauppa/price-backend'
import { logger } from '@verkkokauppa/core'

interface CartItemRowTotal {
  netValue: number
  grossValue: number
  vatValue: number
}
type CartItemUnitPrice = CartItemRowTotal & {
  vatPercentage: number
}

type CartItemWithTotals = CartItem & {
  unitPrice: CartItemUnitPrice
  rowTotal: CartItemRowTotal
}

type CartWithItemsAndTotals = Cart & {
  items: CartItemWithTotals[]
  cartTotals: CartTotals
}

export const calculate = async (p: Cart): Promise<CartWithItemsAndTotals> => {
  const { cartId, items } = p
  logger.debug(`Start calculate process for cartId: ${cartId}`)
  if (!items || items.length === 0) {
    throw new Error('No items to calculate totals for')
  }
  const cart = {
    ...p,
    items: await Promise.all(items.map((item) => calculateItem({ item }))),
  }
  const cartTotals = calculateCart({ cartId, items: cart.items })
  return { ...cart, cartTotals }
}

export const calculateItem = async (p: {
  item: CartItem
}): Promise<CartItemWithTotals> => {
  const { item } = p
  logger.debug(
    `Start calculate process for product: ${item.productId} in cart ${item.cartId}`
  )

  const { productId, quantity } = item
  const price = await getPrice({ productId })
  logger.debug(
    `Price resolved for product: ${item.productId} in cart ${item.cartId}`
  )
  const unitPrice = {
    netValue: parseFloat(price.original.netValue),
    grossValue: parseFloat(price.original.grossValue),
    vatValue: parseFloat(price.original.vatValue),
    vatPercentage: parseInt(price.original.vatPercentage),
  }

  const rowTotal = {
    netValue: unitPrice.netValue * quantity,
    grossValue: unitPrice.grossValue * quantity,
    vatValue: unitPrice.vatValue * quantity,
  }

  return { ...item, rowTotal, unitPrice }
}

export const calculateCart = (p: {
  cartId: string
  items: CartItemWithTotals[]
}): CartTotals => {
  const { cartId, items } = p
  logger.debug(`Combine totals for cartId: ${cartId}`)

  let netValue = 0
  let grossValue = 0
  let vatValue = 0
  let rowTotals = []
  for (const item of items) {
    netValue += item.rowTotal.netValue
    grossValue += item.rowTotal.grossValue
    vatValue += item.rowTotal.vatValue
    rowTotals.push({
      cartItemId: item.cartItemId,
      netValue: item.rowTotal.netValue,
      grossValue: item.rowTotal.grossValue,
      vatValue: item.rowTotal.vatValue,
      vatPercentage: item.unitPrice.vatPercentage,
    })
  }
  return {
    cartId,
    netValue,
    grossValue,
    vatValue,
    rowTotals,
  }
}
