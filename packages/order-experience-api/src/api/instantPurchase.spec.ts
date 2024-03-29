import { InstantPurchase } from './instantPurchase'
import { AbstractController } from '@verkkokauppa/core'
import type { Request, Response } from 'express'

jest.mock('@verkkokauppa/product-backend')
jest.mock('@verkkokauppa/price-backend')
jest.mock('@verkkokauppa/order-backend')
jest.mock('@verkkokauppa/configuration-backend')

const getProductMock = require('@verkkokauppa/product-backend').getProduct.mockImplementation(
  () => ({})
)

const getPriceMock = require('@verkkokauppa/price-backend').getPrice.mockImplementation(
  () => ({ original: {} })
)

const createOrderMock = require('@verkkokauppa/order-backend').createOrder.mockImplementation(
  () => ({})
)

const addItemsToOrderMock = require('@verkkokauppa/order-backend').addItemsToOrder.mockImplementation(
  () => ({})
)

const setOrderTotalsMock = require('@verkkokauppa/order-backend').setOrderTotals.mockImplementation(
  () => ({})
)

const calculateTotalsFromItemsMock = require('@verkkokauppa/order-backend').calculateTotalsFromItems.mockImplementation(
  () => ({})
)

const getMerchantDetailsForOrderMock = require('@verkkokauppa/configuration-backend').getMerchantDetailsForOrder.mockImplementation(
  () => ({})
)

const merchantConfigurationMock = {
  merchantName: 'name',
  merchantStreet: 'street',
}

beforeEach(() => {
  jest.clearAllMocks()
})

const instantPurchase = new (class extends InstantPurchase {
  implementation(req: any, res: Response): Promise<any> {
    return super.implementation(req, res)
  }
})()

const mockResponse = ({
  status: () => ({ json: () => ({}) }),
} as any) as Response

const requestBody = {
  products: [
    {
      productId: 'pid1',
      quantity: 1,
      unit: 'unit1',
      meta: [
        {
          key: 'mk1',
          value: 'mv1',
          label: 'ml1',
          visibleInCheckout: false,
          ordinal: '1',
        },
      ],
    },
    {
      productId: 'pid2',
      quantity: 2,
      unit: 'unit2',
      meta: [
        {
          key: 'mk2',
          value: 'mv2',
          label: 'ml2',
          visibleInCheckout: false,
          ordinal: '1',
        },
      ],
    },
  ],
  language: 'fi',
  namespace: 'ns1',
  user: 'user1',
}

describe('Test instantPurchase', () => {
  it('Should fetch product and price for each product in request body', async () => {
    await instantPurchase.implementation(
      { body: requestBody } as Request,
      mockResponse
    )
    ;[getProductMock, getPriceMock].forEach((mock) => {
      expect(mock).toHaveBeenCalledTimes(2)
      expect(mock.mock.calls[0][0]).toEqual({ productId: 'pid1' })
      expect(mock.mock.calls[1][0]).toEqual({ productId: 'pid2' })
    })
  })
  it('Should create an empty order', async () => {
    await instantPurchase.implementation(
      { body: requestBody } as Request,
      mockResponse
    )
    expect(createOrderMock).toHaveBeenCalledTimes(1)
    expect(createOrderMock.mock.calls[0][0]).toEqual({
      namespace: 'ns1',
      user: 'user1',
    })
  })
  it('Should add order items and totals to the order', async () => {
    getProductMock
      .mockImplementationOnce(() => ({ name: 'n1' }))
      .mockImplementationOnce(() => ({ name: 'n2' }))
    getPriceMock
      .mockImplementationOnce(() => ({
        original: {
          netValue: '50',
          vatValue: '12',
          grossValue: '62',
          vatPercentage: '24',
        },
      }))
      .mockImplementationOnce(() => ({
        original: {
          netValue: '100',
          vatValue: '24',
          grossValue: '124',
          vatPercentage: '24',
        },
      }))
    createOrderMock.mockImplementationOnce(() => ({ orderId: 'oid1' }))
    calculateTotalsFromItemsMock.mockImplementationOnce(() => ({
      priceNet: '250',
      priceVat: '60',
      priceTotal: '310',
    }))
    await instantPurchase.implementation(
      { body: requestBody } as Request,
      mockResponse
    )
    expect(addItemsToOrderMock).toHaveBeenCalledTimes(1)
    expect(addItemsToOrderMock.mock.calls[0][0]).toEqual({
      orderId: 'oid1',
      user: 'user1',
      items: [
        {
          merchantId: '',
          productId: 'pid1',
          productName: 'n1',
          quantity: 1,
          unit: 'unit1',
          rowPriceNet: '50',
          rowPriceVat: '12',
          rowPriceTotal: '62',
          priceNet: '50',
          priceVat: '12',
          priceGross: '62',
          vatPercentage: '24',
          meta: [
            {
              key: 'mk1',
              value: 'mv1',
              label: 'ml1',
              visibleInCheckout: false,
              ordinal: '1',
            },
          ],
        },
        {
          merchantId: '',
          productId: 'pid2',
          productName: 'n2',
          quantity: 2,
          unit: 'unit2',
          rowPriceNet: '200',
          rowPriceVat: '48',
          rowPriceTotal: '248',
          priceNet: '100',
          priceVat: '24',
          priceGross: '124',
          vatPercentage: '24',
          meta: [
            {
              key: 'mk2',
              value: 'mv2',
              label: 'ml2',
              visibleInCheckout: false,
              ordinal: '1',
            },
          ],
        },
      ],
    })
    expect(setOrderTotalsMock).toHaveBeenCalledTimes(1)
    expect(setOrderTotalsMock.mock.calls[0][0]).toEqual({
      orderId: 'oid1',
      user: 'user1',
      priceNet: '250',
      priceVat: '60',
      priceTotal: '310',
    })
  })
  it('Should return created order with order items and totals', async () => {
    const createdSpy = jest.spyOn(AbstractController.prototype, 'created')
    setOrderTotalsMock.mockImplementationOnce(() => ({
      orderId: '100',
      items: [],
      priceNet: 10,
    }))
    getMerchantDetailsForOrderMock.mockImplementationOnce(
      () => merchantConfigurationMock
    )
    const res = await instantPurchase.implementation(
      { body: requestBody } as Request,
      mockResponse
    )
    expect(createdSpy).toHaveBeenCalledTimes(1)
    expect(createdSpy.mock.calls[0]?.[0]).toBe(mockResponse)
    expect(createdSpy.mock.calls[0]?.[1]).toEqual({
      orderId: '100',
      items: [],
      priceNet: 10,
      merchant: {
        merchantName: 'name',
        merchantStreet: 'street',
      },
    })
    expect(res).toBe(createdSpy.mock.results[0]?.value)
  })
  it('Should throw for unknown errors', async () => {
    getProductMock.mockImplementationOnce(() => {
      throw new Error()
    })
    await expect(
      instantPurchase.implementation(
        { body: requestBody } as Request,
        mockResponse
      )
    ).rejects.toThrow()
  })
})
