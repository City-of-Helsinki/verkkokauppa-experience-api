import { PaytrailCardUpdateRedirectSuccessController } from './paytrailCardUpdateRedirectSuccessController'
import type { Request, Response } from 'express'

jest.mock('@verkkokauppa/payment-backend')
jest.mock('@verkkokauppa/order-backend')
jest.mock('axios')

const getOrderAdminMock = require('@verkkokauppa/order-backend').getOrderAdmin.mockImplementation(
  () => {}
)

const checkPaytrailCardUpdateReturnUrlMock = require('@verkkokauppa/payment-backend').checkPaytrailCardUpdateReturnUrl.mockImplementation(
  () => undefined
)

const controller = new (class extends PaytrailCardUpdateRedirectSuccessController {
  implementation(req: Request, res: Response): Promise<any> {
    return super.implementation(req, res)
  }
})()

const mockRedirect = jest.fn()
const mockResponse = ({
  redirect: mockRedirect,
} as any) as Response

beforeEach(() => {
  jest.clearAllMocks()
})

const orderId = '1234'

describe('Test paytrailCardUpdateRedirectSuccessController', () => {
  it('should throw for missing REDIRECT_PAYTRAIL_PAYMENT_URL_BASE', async () => {
    await expect(async () => {
      await controller.implementation(
        { params: { orderId }, query: {} } as any,
        mockResponse
      )
    }).rejects.toThrow('No default paytrail redirect url defined')
  })
  it('should redirect to failure if orderId is missing', async () => {
    process.env.REDIRECT_PAYTRAIL_PAYMENT_URL_BASE = 'https://test.dev.hel'
    await controller.implementation(
      { params: {}, query: {} } as any,
      mockResponse
    )
    expect(mockRedirect).toHaveBeenCalledTimes(1)
    expect(mockRedirect.mock.calls[0][0]).toEqual(302)
    expect(mockRedirect.mock.calls[0][1]).toEqual(
      `https://test.dev.hel/card-update-failed`
    )
  })
  it('should redirect to failure if order cannot be fetched', async () => {
    process.env.REDIRECT_PAYTRAIL_PAYMENT_URL_BASE = 'https://test.dev.hel'
    getOrderAdminMock.mockImplementationOnce(() => {
      throw new Error()
    })
    await controller.implementation(
      { params: { orderId }, query: {} } as any,
      mockResponse
    )
    expect(mockRedirect).toHaveBeenCalledTimes(1)
    expect(mockRedirect.mock.calls[0][0]).toEqual(302)
    expect(mockRedirect.mock.calls[0][1]).toEqual(
      `https://test.dev.hel/${orderId}/card-update-failed`
    )
  })
  it('should redirect to failure if checkPaytrailCardReturnUrl fails', async () => {
    process.env.REDIRECT_PAYTRAIL_PAYMENT_URL_BASE = 'https://test.dev.hel'
    checkPaytrailCardUpdateReturnUrlMock.mockImplementationOnce(() => {
      throw new Error()
    })
    await controller.implementation(
      { params: { orderId }, query: {} } as any,
      mockResponse
    )
    expect(mockRedirect).toHaveBeenCalledTimes(1)
    expect(mockRedirect.mock.calls[0][0]).toEqual(302)
    expect(mockRedirect.mock.calls[0][1]).toEqual(
      `https://test.dev.hel/${orderId}/card-update-failed`
    )
  })
  it('should redirect to success', async () => {
    process.env.REDIRECT_PAYTRAIL_PAYMENT_URL_BASE = 'https://test.dev.hel'
    await controller.implementation(
      { params: { orderId }, query: {} } as any,
      mockResponse
    )
    expect(mockRedirect).toHaveBeenCalledTimes(1)
    expect(mockRedirect.mock.calls[0][0]).toEqual(302)
    expect(mockRedirect.mock.calls[0][1]).toEqual(
      `https://test.dev.hel/${orderId}/card-update-success`
    )
  })
})
