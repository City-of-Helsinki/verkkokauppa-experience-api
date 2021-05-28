import { calculate, calculateCart, calculateItem } from './totalsService'
import axios from 'axios'

jest.mock('axios')
const axiosMock = axios as jest.Mocked<typeof axios>

describe('Test total calculator service', () => {
  it('Should calculate item correctly', async () => {
    process.env.PRICE_BACKEND_URL = 'test.dev.hel'
    const mockData = {
      productId: 'test',
      price: 123.45,
      original: {
        productId: '1234',
        netValue: '100',
        vatPercentage: '24',
        grossValue: '124',
        vatValue: '24',
        id: '1',
      },
    }
    axiosMock.get.mockResolvedValue({ data: mockData })
    const item = {
      cartItemId: '49c96654-e84f-48e8-8fbe-33ba25ab0bb6',
      cartId: '5585142a-6e0e-4439-bfcc-860e99711deb',
      productId: 'test',
      quantity: 1,
      unit: 'pcs',
    }
    const result = await calculateItem({ item })
    expect(result).toEqual({
      cartId: '5585142a-6e0e-4439-bfcc-860e99711deb',
      cartItemId: '49c96654-e84f-48e8-8fbe-33ba25ab0bb6',
      productId: 'test',
      quantity: 1,
      rowTotal: {
        grossValue: 124,
        netValue: 100,
        vatValue: 24,
      },
      unit: 'pcs',
      unitPrice: {
        grossValue: 124,
        netValue: 100,
        vatPercentage: 24,
        vatValue: 24,
      },
    })
  })
  it('Should calculate cart correctly', async () => {
    process.env.PRICE_BACKEND_URL = 'test.dev.hel'
    const mockData = {
      productId: 'test',
      price: 123.45,
      original: {
        productId: '1234',
        netValue: '100',
        vatPercentage: '24',
        grossValue: '124',
        vatValue: '24',
        id: '1',
      },
    }
    axiosMock.get.mockResolvedValue({ data: mockData })
    const item = {
      cartItemId: '49c96654-e84f-48e8-8fbe-33ba25ab0bb6',
      cartId: '5585142a-6e0e-4439-bfcc-860e99711deb',
      productId: 'test',
      quantity: 1,
      unit: 'pcs',
      unitPrice: {
        grossValue: 124,
        netValue: 100,
        vatPercentage: 24,
        vatValue: 24,
      },
      rowTotal: {
        grossValue: 124,
        netValue: 100,
        vatValue: 24,
      },
    }
    const result = await calculateCart({ cartId: item.cartId, items: [item] })
    expect(result).toEqual({
      cartId: '5585142a-6e0e-4439-bfcc-860e99711deb',
      rowTotals: [
        {
          cartItemId: '49c96654-e84f-48e8-8fbe-33ba25ab0bb6',
          grossValue: 124,
          netValue: 100,
          vatPercentage: 24,
          vatValue: 24,
        },
      ],
      netValue: 100,
      grossValue: 124,
      vatValue: 24,
    })
  })
  it('Should calculate totals correctly', async () => {
    process.env.PRICE_BACKEND_URL = 'test.dev.hel'
    const mockData = {
      productId: 'test',
      price: 123.45,
      original: {
        productId: '1234',
        netValue: '100',
        vatPercentage: '24',
        grossValue: '124',
        vatValue: '24',
        id: '1',
      },
    }
    axiosMock.get.mockResolvedValue({ data: mockData })
    const item = {
      cartItemId: '49c96654-e84f-48e8-8fbe-33ba25ab0bb6',
      cartId: '5585142a-6e0e-4439-bfcc-860e99711deb',
      productId: 'test',
      quantity: 1,
      unit: 'pcs',
      unitPrice: {
        grossValue: 124,
        netValue: 100,
        vatPercentage: 24,
        vatValue: 24,
      },
      rowTotal: {
        grossValue: 124,
        netValue: 100,
        vatValue: 24,
      },
    }
    const result = await calculate({
      cartId: item.cartId,
      items: [item],
      namespace: 'test',
      createdAt: '123',
      user: 'test',
    })
    expect(result).toEqual({
      cartId: '5585142a-6e0e-4439-bfcc-860e99711deb',
      namespace: 'test',
      createdAt: '123',
      items: [item],
      cartTotals: {
        cartId: '5585142a-6e0e-4439-bfcc-860e99711deb',
        rowTotals: [
          {
            cartItemId: '49c96654-e84f-48e8-8fbe-33ba25ab0bb6',
            grossValue: 124,
            netValue: 100,
            vatPercentage: 24,
            vatValue: 24,
          },
        ],
        netValue: 100,
        grossValue: 124,
        vatValue: 24,
      },
    })
  })
})
