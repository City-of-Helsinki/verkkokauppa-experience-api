import { calculateTotalsFromItems } from './totals'
import { logger } from '@verkkokauppa/core'

describe('calculateTotalsFromItems', () => {
  it('sums multiple items correctly (happy path)', () => {
    const order = {
      items: [
        { rowPriceNet: '0.8', rowPriceVat: '0.2', rowPriceTotal: '1' },
        { rowPriceNet: '0.4', rowPriceVat: '0.1', rowPriceTotal: '0.5' },
      ],
    }

    const totals = calculateTotalsFromItems(order as any)
    expect(totals.priceNet).toEqual('1.20')
    expect(totals.priceVat).toEqual('0.30')
    expect(totals.priceTotal).toEqual('1.50')
  })

  it('handles a single item', () => {
    const order = {
      items: [{ rowPriceNet: '5', rowPriceVat: '1.25', rowPriceTotal: '6.25' }],
    }

    const totals = calculateTotalsFromItems(order as any)
    expect(totals.priceNet).toEqual('5.00')
    expect(totals.priceVat).toEqual('1.25')
    expect(totals.priceTotal).toEqual('6.25')
  })

  it('returns zero totals for empty items', () => {
    const order = { items: [] }
    const totals = calculateTotalsFromItems(order as any)
    expect(totals.priceNet).toEqual('0.00')
    expect(totals.priceVat).toEqual('0.00')
    expect(totals.priceTotal).toEqual('0.00')
  })

  it('logs a warning if net + vat != total', () => {
    const order = {
      items: [
        {
          rowPriceNet: '1',
          rowPriceVat: '0.5',
          rowPriceTotal: '1.6',
          orderId: 'orderIdValue',
        },
      ],
    }

    // @ts-ignore
    const warnSpy = jest.spyOn(logger, 'error').mockImplementation(() => {})
    calculateTotalsFromItems(order as any)
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Mismatch detected')
    )
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining(order?.items[0]?.orderId as any)
    )
    warnSpy.mockRestore()
  })

  it('handles large numbers without precision loss', () => {
    const order = {
      items: [
        {
          rowPriceNet: '1000000000',
          rowPriceVat: '250000000',
          rowPriceTotal: '1250000000',
        },
      ],
    }

    const totals = calculateTotalsFromItems(order as any)
    expect(totals.priceNet).toEqual('1000000000.00')
    expect(totals.priceVat).toEqual('250000000.00')
    expect(totals.priceTotal).toEqual('1250000000.00')
  })

  it('handles different decimal lengths', () => {
    const order = {
      items: [
        { rowPriceNet: '1', rowPriceVat: '0.2', rowPriceTotal: '1.2' },
        { rowPriceNet: '1.23', rowPriceVat: '0.45', rowPriceTotal: '1.68' },
      ],
    }

    const totals = calculateTotalsFromItems(order as any)
    expect(totals.priceNet).toEqual('2.23')
    expect(totals.priceVat).toEqual('0.65')
    expect(totals.priceTotal).toEqual('2.88')
  })

  it('fuzzy test: many random items should sum consistently', () => {
    const randomInt = (min: number, max: number) =>
      Math.floor(Math.random() * (max - min + 1)) + min

    for (let run = 0; run < 100; run++) {
      // generate a random order with 50–200 items
      const items = Array.from({ length: randomInt(50, 200) }, () => {
        // random net in cents between 1 and 500 (0.01 – 5.00)
        const netCents = randomInt(1, 500)
        const vatCents = randomInt(0, 200)
        const totalCents = netCents + vatCents

        return {
          rowPriceNet: (netCents / 100).toString(),
          rowPriceVat: (vatCents / 100).toString(),
          rowPriceTotal: (totalCents / 100).toString(),
        }
      })

      const totals = calculateTotalsFromItems({ items } as any)

      // convert results back to cents for reliable comparison
      const parseToCents = (s: string) => {
        const [euros, cents = ''] = s.split('.')
        return BigInt(euros) * BigInt(100) + BigInt((cents + '00').slice(0, 2))
      }

      const net = parseToCents(totals.priceNet)
      const vat = parseToCents(totals.priceVat)
      const total = parseToCents(totals.priceTotal)

      expect(net + vat).toEqual(total)
    }
  })
})
