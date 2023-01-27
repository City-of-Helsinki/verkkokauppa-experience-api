/* eslint-disable */

import { PaytrailCardRedirectSuccessController } from './paytrailCardRedirectSuccessController'
import type { Request, Response } from 'express'

jest.mock('@verkkokauppa/order-backend')
jest.mock('@verkkokauppa/payment-backend')
jest.mock('@verkkokauppa/configuration-backend')

const orderId = 'oid1'
const globalUrl = 'https://test.dev.hel'
const namespace = 'ns1'

const order = {
  orderId,
  namespace,
}

const payment = {
  status: 'payment_paid_online'
}

const getOrderAdminMock = require('@verkkokauppa/order-backend').getOrderAdmin.mockImplementation(
  () => order
)

const getPublicServiceConfigurationMock = require('@verkkokauppa/configuration-backend').getPublicServiceConfiguration.mockImplementation(
  () => null
)

const checkPaytrailCardReturnUrlMock = require('@verkkokauppa/payment-backend').checkPaytrailCardReturnUrl.mockImplementation(
  () => payment
)

const controller = new (class extends PaytrailCardRedirectSuccessController {
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

describe('Test paytrailCardRedirectSuccessController', () => {
  const expectSummaryRedirect = (baseUrl?: string) => {
    expect(mockRedirect).toHaveBeenCalledTimes(1)
    expect(mockRedirect.mock.calls[0][0]).toEqual(302)
    expect(mockRedirect.mock.calls[0][1]).toEqual(
      `${baseUrl || globalUrl}/summary?paymentPaid=false`
    )
  }

  it('should throw for missing REDIRECT_PAYTRAIL_PAYMENT_URL_BASE', async () => {
    await expect(async () => {
      await controller.implementation({ params: { orderId }, query: { } } as any, mockResponse)
    }).rejects.toThrow('No default paytrail redirect url defined')
  })
  it('should redirect to summary if orderId is missing', async () => {
    process.env.REDIRECT_PAYTRAIL_PAYMENT_URL_BASE = globalUrl
    await controller.implementation(
      { params: { }, query: { } } as any,
      mockResponse
    )
    expectSummaryRedirect()
  })
  it('should redirect to summary if order cannot be fetched', async () => {
    process.env.REDIRECT_PAYTRAIL_PAYMENT_URL_BASE = globalUrl
    getOrderAdminMock.mockImplementationOnce(() => {
      throw new Error()
    })
    await controller.implementation(
      { params: { orderId }, query: { } } as any,
      mockResponse
    )
    expectSummaryRedirect()
  })
  it('should redirect to summary if getPublicServiceConfiguration fails', async () => {
    process.env.REDIRECT_PAYTRAIL_PAYMENT_URL_BASE = globalUrl
    getPublicServiceConfigurationMock.mockImplementationOnce(() => {
      throw new Error()
    })
    await controller.implementation(
      { params: { orderId }, query: { } } as any,
      mockResponse
    )
    expectSummaryRedirect()
  })
  it('should redirect to summary if checkPaytrailCardReturnUrl fails', async () => {
    process.env.REDIRECT_PAYTRAIL_PAYMENT_URL_BASE = globalUrl
    checkPaytrailCardReturnUrlMock.mockImplementationOnce(() => {
      throw new Error()
    })
    await controller.implementation(
      { params: { orderId }, query: { } } as any,
      mockResponse
    )
    expectSummaryRedirect()
  })
  it('should redirect to summary if payment status is not payment_paid_online', async () => {
    process.env.REDIRECT_PAYTRAIL_PAYMENT_URL_BASE = globalUrl
    checkPaytrailCardReturnUrlMock.mockImplementationOnce(() => ({
      status: 'payment_paid'
    }))
    await controller.implementation(
      { params: { orderId }, query: { } } as any,
      mockResponse
    )
    expectSummaryRedirect()
  })
  it('should redirect to success', async () => {
    process.env.REDIRECT_PAYTRAIL_PAYMENT_URL_BASE = globalUrl
    await controller.implementation(
      { params: { orderId }, query: { } } as any,
      mockResponse
    )
    expect(mockRedirect).toHaveBeenCalledTimes(1)
    expect(mockRedirect.mock.calls[0][0]).toEqual(302)
    expect(mockRedirect.mock.calls[0][1]).toEqual(
      `${globalUrl}/success`
    )
  })
  it('should redirect to service specific success if service redirect url is present', async () => {
    process.env.REDIRECT_PAYTRAIL_PAYMENT_URL_BASE = globalUrl
    const serviceUrl = 'https://testservice.dev.hel'
    getPublicServiceConfigurationMock.mockImplementationOnce(() => ({
      configurationValue: serviceUrl
    }))
    await controller.implementation(
      { params: { orderId }, query: { } } as any,
      mockResponse
    )
    expect(mockRedirect).toHaveBeenCalledTimes(1)
    expect(mockRedirect.mock.calls[0][0]).toEqual(302)
    expect(mockRedirect.mock.calls[0][1]).toEqual(
      `${serviceUrl}/success`
    )
  })
  it('should redirect to service specific summary if service redirect url is present', async () => {
    process.env.REDIRECT_PAYTRAIL_PAYMENT_URL_BASE = globalUrl
    const serviceUrl = 'https://testservice.dev.hel'
    getPublicServiceConfigurationMock.mockImplementationOnce(() => ({
      configurationValue: serviceUrl
    }))
    checkPaytrailCardReturnUrlMock.mockImplementationOnce(() => ({
      status: 'not_paid'
    }))
    await controller.implementation(
      { params: { orderId }, query: { } } as any,
      mockResponse
    )
    expectSummaryRedirect(serviceUrl)
  })
})
