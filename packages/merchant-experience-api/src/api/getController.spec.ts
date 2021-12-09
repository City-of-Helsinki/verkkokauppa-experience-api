import { GetController } from './getController'
import type { Request, Response } from 'express'
import { AbstractController } from '@verkkokauppa/core'

jest.mock('@verkkokauppa/configuration-backend')

const getAllPublicServiceConfigurationMock = require('@verkkokauppa/configuration-backend').getAllPublicServiceConfiguration.mockImplementation(
  () => []
)

const getController = new (class extends GetController {
  implementation(req: Request, res: Response): Promise<any> {
    return super.implementation(req as any, res)
  }
})()

const mockResponse = ({
  status: () => ({ json: () => ({}) }),
} as any) as Response

describe('Test getController', () => {
  it('Should call getAllPublicServiceConfiguration', async () => {
    await getController.implementation(
      { params: { namespace: 'ns1' } } as any,
      mockResponse
    )
    expect(getAllPublicServiceConfigurationMock).toHaveBeenCalledTimes(1)
    expect(getAllPublicServiceConfigurationMock.mock.calls[0][0]).toEqual({
      namespace: 'ns1',
    })
  })
  it('Should return merchant configuration map', async () => {
    const successSpy = jest.spyOn(AbstractController.prototype, 'success')
    getAllPublicServiceConfigurationMock.mockImplementationOnce(() => [
      { configurationKey: 'MERCHANT_NAME', configurationValue: 'mn1' },
      { configurationKey: 'merchantZip', configurationValue: 'mz1' },
      { configurationKey: 'unknown', configurationValue: '' },
      { configurationKey: 'MERCHANT_URL', configurationValue: 'murl1' },
      { configurationKey: 'merchantUrl', configurationValue: 'murl2' },
      {
        configurationKey: 'ORDER_CREATED_REDIRECT_URL',
        configurationValue: 'https://test.url',
      },
      {
        configurationKey: 'merchantPaymentWebhookUrl',
        configurationValue: 'merchant_payment_webhook',
      },
      {
        configurationKey: 'merchantOrderWebhookUrl',
        configurationValue: 'merchant_order_webhook',
      },
      {
        configurationKey: 'merchantSubscriptionWebhookUrl',
        configurationValue: 'merchant_subscription_webhook',
      },
    ])
    await getController.implementation(
      { params: { namespace: 'ns1' } } as any,
      mockResponse
    )
    expect(successSpy).toHaveBeenCalledTimes(1)
    expect(successSpy.mock.calls[0]?.[0]).toBe(mockResponse)
    expect(successSpy.mock.calls[0]?.[1]).toEqual({
      merchantName: 'mn1',
      merchantZip: 'mz1',
      merchantUrl: 'murl2',
      orderCreatedRedirectUrl: 'https://test.url',
      merchantPaymentWebhookUrl: 'merchant_payment_webhook',
      merchantOrderWebhookUrl: 'merchant_order_webhook',
      merchantSubscriptionWebhookUrl: 'merchant_subscription_webhook',
    })
  })
})
