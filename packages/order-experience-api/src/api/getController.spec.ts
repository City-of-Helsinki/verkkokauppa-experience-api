import { AbstractController, ValidatedRequest } from '@verkkokauppa/core'
import type { Response } from 'express'
import { GetController } from './getController'

jest.mock('@verkkokauppa/configuration-backend')
jest.mock('@verkkokauppa/order-backend')

const getOrderMock = require('@verkkokauppa/order-backend').getOrder.mockImplementation(
  () => ({})
)

const orderMock = {
  orderId: 'test123',
  namespace: 'n1',
  items: [
    {
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
}

const getMerchantDetailsForOrderMock = require('@verkkokauppa/configuration-backend').getMerchantDetailsForOrder.mockImplementation(
  () => ({})
)

const merchantConfigurationMock = [
  {
    configurationId: 'i1',
    namespace: 'n1',
    configurationKey: 'MERCHANT_NAME',
    configurationValue: 'name',
  },
  {
    configurationId: 'i2',
    namespace: 'n2',
    configurationKey: 'MERCHANT_STREET',
    configurationValue: 'street',
  },
]

beforeEach(() => {
  jest.clearAllMocks()
})

const getController = new (class extends GetController {
  implementation(req: ValidatedRequest<any>, res: Response): Promise<any> {
    return super.implementation(req, res)
  }
})()

const mockResponse = ({
  status: () => ({ json: () => ({}) }),
} as any) as Response

const requestBody = {}
const requestHeaders = {}

describe('Test getController', () => {
  it('Should get order with merchant details', async () => {
    const successSpy = jest.spyOn(AbstractController.prototype, 'success')
    getMerchantDetailsForOrderMock.mockImplementationOnce(
      () => merchantConfigurationMock
    )
    getOrderMock.mockImplementationOnce(() => orderMock)
    const res = await getController.implementation(
      {
        params: { orderId: 'test123' },
        body: requestBody,
        headers: requestHeaders,
      } as any,
      mockResponse
    )
    expect(successSpy).toHaveBeenCalledTimes(1)
    expect(successSpy.mock.calls[0]?.[0]).toBe(mockResponse)
    expect(successSpy.mock.calls[0]?.[1]).toEqual({
      ...orderMock,
      merchant: {
        merchantName: 'name',
        merchantStreet: 'street',
      },
    })
    expect(res).toBe(successSpy.mock.results[0]?.value)
  })
  it('Should get order without merchant details', async () => {
    const successSpy = jest.spyOn(AbstractController.prototype, 'success')
    getMerchantDetailsForOrderMock.mockImplementationOnce(() => [])
    getOrderMock.mockImplementationOnce(() => orderMock)
    const res = await getController.implementation(
      {
        params: { orderId: 'test123' },
        body: requestBody,
        headers: requestHeaders,
      } as any,
      mockResponse
    )
    expect(successSpy).toHaveBeenCalledTimes(1)
    expect(successSpy.mock.calls[0]?.[0]).toBe(mockResponse)
    expect(successSpy.mock.calls[0]?.[1]).toEqual({
      ...orderMock,
      merchant: {},
    })
    expect(res).toBe(successSpy.mock.results[0]?.value)
  })
})
