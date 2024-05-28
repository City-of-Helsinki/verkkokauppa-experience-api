import { AbstractController, ValidatedRequest } from '@verkkokauppa/core'
import type { Response } from 'express'
import { GetCancelController } from './getCancelUrlController'

jest.mock('@verkkokauppa/order-backend')
jest.mock('@verkkokauppa/configuration-backend')

const getOrderMock = require('@verkkokauppa/order-backend').getOrder.mockImplementation(
  () => ({})
)
const getPublicServiceConfigurationMock = require('@verkkokauppa/configuration-backend').getPublicServiceConfiguration.mockImplementation(
  () => ({})
)

const orderMock = {
  orderId: 'orderId',
}

beforeEach(() => {
  jest.clearAllMocks()
})

const getCancelController = new (class extends GetCancelController {
  implementation(req: ValidatedRequest<any>, res: Response): Promise<any> {
    return super.implementation(req, res)
  }
})()

const mockResponse = ({
  status: () => ({ json: () => ({}) }),
} as any) as Response

const requestBody = {}
const requestHeaders = {}

const mockRequest = {
  params: { id: 'test123' },
  body: requestBody,
  headers: requestHeaders,
} as any

describe('Test GetCancelController', () => {
  it('Should fetch cancel url using order id and user as header from service configuration', async () => {
    const successSpy = jest.spyOn(AbstractController.prototype, 'success')
    getOrderMock.mockImplementationOnce(() => orderMock)

    const cancelUrlMock = 'https://localhost:3000/'
    getPublicServiceConfigurationMock.mockImplementationOnce(() => {
      return new Promise((resolve) =>
        resolve({ configurationValue: cancelUrlMock })
      )
    })

    const res = await getCancelController.implementation(
      mockRequest,
      mockResponse
    )
    expect(successSpy).toHaveBeenCalledTimes(1)
    expect(successSpy.mock.calls[0]?.[0]).toBe(mockResponse)
    expect(successSpy.mock.calls[0]?.[1]).toEqual({
      cancelUrl: `https://localhost:3000/?orderId=${orderMock.orderId}`,
      order: {
        orderId: orderMock.orderId,
      },
    })
    expect(res).toBe(successSpy.mock.results[0]?.value)
    expect(`${cancelUrlMock}?orderId=${orderMock.orderId}`).toBe(
      // @ts-ignore
      successSpy.mock.calls[0]?.[1].cancelUrl
    )
  })

  it('Cancel url is null if invalid url / missing from database', async () => {
    const successSpy = jest.spyOn(AbstractController.prototype, 'success')
    getOrderMock.mockImplementationOnce(() => orderMock)

    getPublicServiceConfigurationMock.mockImplementationOnce(() => {
      return new Promise((resolve) => resolve({}))
    })

    const res = await getCancelController.implementation(
      mockRequest,
      mockResponse
    )
    expect(successSpy).toHaveBeenCalledTimes(1)
    expect(successSpy.mock.calls[0]?.[0]).toBe(mockResponse)
    expect(successSpy.mock.calls[0]?.[1]).toEqual({
      cancelUrl: null,
      order: {
        orderId: orderMock.orderId,
      },
    })
    expect(res).toBe(successSpy.mock.results[0]?.value)
    // @ts-ignore
    expect(successSpy.mock.calls[0]?.[1].cancelUrl).toBe(null)
  })
})
