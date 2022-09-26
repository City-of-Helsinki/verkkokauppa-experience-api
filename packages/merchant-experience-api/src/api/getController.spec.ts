import { GetController } from './getController'
import type { Request, Response } from 'express'
import { AbstractController, ExperienceError } from '@verkkokauppa/core'

jest.mock('@verkkokauppa/configuration-backend')

const getAllPublicServiceConfigurationMock = require('@verkkokauppa/configuration-backend').getAllPublicServiceConfiguration.mockImplementation(
  () => []
)

const getMerchantModels = require('@verkkokauppa/configuration-backend').getMerchantModels.mockImplementation(
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

class NoErrorThrownError extends Error {}

const getError = async <TError>(call: () => unknown): Promise<TError> => {
  try {
    await call()

    throw new NoErrorThrownError()
  } catch (error: unknown) {
    return error as TError
  }
}

function mockMultiMerchantResponses() {
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

  getMerchantModels.mockImplementationOnce(() => {
    return [
      {
        merchantId: 'mock_merchant',
        configurations: [
          { key: 'MERCHANT_NAME', value: 'OVERRIDE:mn1' },
          { key: 'merchantZip', value: 'OVERRIDE:mz1' },
          { key: 'unknown', value: 'OVERRIDE:' },
          { key: 'MERCHANT_URL', value: 'OVERRIDE:murl1' },
          { key: 'merchantUrl', value: 'OVERRIDE:murl2' },
          {
            key: 'ORDER_CREATED_REDIRECT_URL',
            value: 'OVERRIDE:https://test.url',
          },
          {
            key: 'merchantPaymentWebhookUrl',
            value: 'OVERRIDE:merchant_payment_webhook',
          },
          {
            key: 'merchantOrderWebhookUrl',
            value: 'OVERRIDE:merchant_order_webhook',
          },
          {
            key: 'merchantSubscriptionWebhookUrl',
            value: 'OVERRIDE:merchant_subscription_webhook',
          },
        ],
      },
      {
        merchantId: 'mock_merchant_2',
        configurations: [
          { key: 'MERCHANT_NAME', value: 'OVERRIDE:mn1' },
          { key: 'merchantZip', value: 'OVERRIDE:mz1' },
          { key: 'unknown', value: 'OVERRIDE:' },
          { key: 'MERCHANT_URL', value: 'OVERRIDE:murl1' },
          { key: 'merchantUrl', value: 'OVERRIDE:murl2' },
          {
            key: 'ORDER_CREATED_REDIRECT_URL',
            value: 'OVERRIDE:https://test.url',
          },
          {
            key: 'merchantPaymentWebhookUrl',
            value: 'OVERRIDE:merchant_payment_webhook',
          },
          {
            key: 'merchantOrderWebhookUrl',
            value: 'OVERRIDE:merchant_order_webhook',
          },
          {
            key: 'merchantSubscriptionWebhookUrl',
            value: 'OVERRIDE:merchant_subscription_webhook',
          },
        ],
      },
    ]
  })
}

describe('Test getController', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

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

  it('Should return merchant configuration map with merchant overrides', async () => {
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

    getMerchantModels.mockImplementationOnce(() => {
      return [
        {
          merchantId: 'mock_merchant',
          configurations: [
            { key: 'MERCHANT_NAME', value: 'OVERRIDE:mn1' },
            { key: 'merchantZip', value: 'OVERRIDE:mz1' },
            { key: 'unknown', value: 'OVERRIDE:' },
            { key: 'MERCHANT_URL', value: 'OVERRIDE:murl1' },
            { key: 'merchantUrl', value: 'OVERRIDE:murl2' },
            {
              key: 'ORDER_CREATED_REDIRECT_URL',
              value: 'OVERRIDE:https://test.url',
            },
            {
              key: 'merchantPaymentWebhookUrl',
              value: 'OVERRIDE:merchant_payment_webhook',
            },
            {
              key: 'merchantOrderWebhookUrl',
              value: 'OVERRIDE:merchant_order_webhook',
            },
            {
              key: 'merchantSubscriptionWebhookUrl',
              value: 'OVERRIDE:merchant_subscription_webhook',
            },
          ],
        },
      ]
    })

    await getController.implementation(
      { params: { namespace: 'ns1', merchantId: 'mock_merchant' } } as any,
      mockResponse
    )
    expect(successSpy).toHaveBeenCalledTimes(1)
    expect(successSpy.mock.calls[0]?.[0]).toBe(mockResponse)
    expect(successSpy.mock.calls[0]?.[1]).toEqual({
      merchantName: 'OVERRIDE:mn1',
      merchantZip: 'OVERRIDE:mz1',
      merchantUrl: 'OVERRIDE:murl2',
      orderCreatedRedirectUrl: 'OVERRIDE:https://test.url',
      merchantPaymentWebhookUrl: 'OVERRIDE:merchant_payment_webhook',
      merchantOrderWebhookUrl: 'OVERRIDE:merchant_order_webhook',
      merchantSubscriptionWebhookUrl: 'OVERRIDE:merchant_subscription_webhook',
    })
  })

  it('Should return merchant configuration map with merchant overrides without merchantId', async () => {
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

    getMerchantModels.mockImplementationOnce(() => {
      return [
        {
          merchantId: 'mock_merchant',
          configurations: [
            { key: 'MERCHANT_NAME', value: 'OVERRIDE:mn1' },
            { key: 'merchantZip', value: 'OVERRIDE:mz1' },
            { key: 'unknown', value: 'OVERRIDE:' },
            { key: 'MERCHANT_URL', value: 'OVERRIDE:murl1' },
            { key: 'merchantUrl', value: 'OVERRIDE:murl2' },
            {
              key: 'ORDER_CREATED_REDIRECT_URL',
              value: 'OVERRIDE:https://test.url',
            },
            {
              key: 'merchantPaymentWebhookUrl',
              value: 'OVERRIDE:merchant_payment_webhook',
            },
            {
              key: 'merchantOrderWebhookUrl',
              value: 'OVERRIDE:merchant_order_webhook',
            },
            {
              key: 'merchantSubscriptionWebhookUrl',
              value: 'OVERRIDE:merchant_subscription_webhook',
            },
          ],
        },
      ]
    })

    await getController.implementation(
      { params: { namespace: 'ns1' } } as any,
      mockResponse
    )
    expect(successSpy).toHaveBeenCalledTimes(1)
    expect(successSpy.mock.calls[0]?.[0]).toBe(mockResponse)
    expect(successSpy.mock.calls[0]?.[1]).toEqual({
      merchantName: 'OVERRIDE:mn1',
      merchantZip: 'OVERRIDE:mz1',
      merchantUrl: 'OVERRIDE:murl2',
      orderCreatedRedirectUrl: 'OVERRIDE:https://test.url',
      merchantPaymentWebhookUrl: 'OVERRIDE:merchant_payment_webhook',
      merchantOrderWebhookUrl: 'OVERRIDE:merchant_order_webhook',
      merchantSubscriptionWebhookUrl: 'OVERRIDE:merchant_subscription_webhook',
    })
  })

  it('Should return error if multiple merchants and no merchantId given in parameters', async () => {
    mockMultiMerchantResponses()

    const error = await getError(
      async () =>
        await getController.implementation(
          { params: { namespace: 'ns1' } } as any,
          mockResponse
        )
    )
    // check that the returned error wasn't that no error was thrown
    expect(error).not.toBeInstanceOf(NoErrorThrownError)
    expect(error).toBeInstanceOf(ExperienceError)

    const experienceError = error as ExperienceError
    expect(experienceError.definition).toEqual({
      code: 'failed-to-fetch-merchant-configurations',
      message:
        'Failed to fetch merchant configurations - Could not resolve merchant, multiple found.',
      responseStatus: 500,
      logLevel: 'error',
    })
  })

  it('Should return error if merchant id is given but not found with id', async () => {
    mockMultiMerchantResponses()

    const error = await getError(
      async () =>
        await getController.implementation(
          {
            params: { namespace: 'ns1', merchantId: 'hidden-merchant' },
          } as any,
          mockResponse
        )
    )
    // check that the returned error wasn't that no error was thrown
    expect(error).not.toBeInstanceOf(NoErrorThrownError)
    expect(error).toBeInstanceOf(ExperienceError)

    const experienceError = error as ExperienceError
    expect(experienceError.definition).toEqual({
      code: 'failed-to-fetch-merchant-configurations',
      message: 'Failed to fetch - Merchant not found.',
      responseStatus: 500,
      logLevel: 'error',
    })
  })
})
