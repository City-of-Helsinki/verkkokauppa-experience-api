// Convert a price string like "1", "1.2", "1.20" into cents as BigInt
import type { OrderItem, OrderItemRequest } from './types'
import { logger } from '@verkkokauppa/core'

const parsePriceToCents = (price: string): bigint => {
  const [euros, cents = ''] = price.split('.')
  const eurosPart = BigInt(euros) // whole euros
  const centsPart = BigInt((cents + '00').slice(0, 2)) // pad/truncate to 2 decimals
  return eurosPart * BigInt(100) + centsPart
}

// Format BigInt cents back into a string with exactly two decimals
const formatCents = (cents: bigint): string => {
  const euros = cents / BigInt(100)
  const remainder = cents % BigInt(100)
  return `${euros}.${remainder.toString().padStart(2, '0')}`
}

export const calculateTotalsFromItems = (p: {
  items: (OrderItemRequest & Pick<OrderItem, 'orderId'>)[]
}): {
  priceNet: string
  priceVat: string
  priceTotal: string
} => {
  const { items } = p

  // Initialize totals as BigInt (using constructor, not literals like 0n)
  let priceNet = BigInt(0)
  let priceVat = BigInt(0)
  let priceTotal = BigInt(0)

  for (const item of items) {
    priceNet += parsePriceToCents(item.rowPriceNet)
    priceVat += parsePriceToCents(item.rowPriceVat)
    priceTotal += parsePriceToCents(item.rowPriceTotal)
  }

  // Consistency check: net + vat should equal total
  if (priceNet + priceVat !== priceTotal) {
    if (items[0] && items[0]?.orderId) {
      logger.error(
        `[TotalsCheck] ${items[0].orderId} Mismatch detected: net(${formatCents(
          priceNet
        )}) + vat(${formatCents(priceVat)}) != total(${formatCents(
          priceTotal
        )})`
      )
    }
  }

  return {
    priceNet: formatCents(priceNet),
    priceVat: formatCents(priceVat),
    priceTotal: formatCents(priceTotal),
  }
}
