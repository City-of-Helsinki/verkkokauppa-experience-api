import type { Request, Response } from 'express'
import { ExperienceError, StatusCode } from '@verkkokauppa/core'
import { UpdateMerchantController } from './updateMerchantController'

jest.mock('@verkkokauppa/configuration-backend')

const getAllPublicServiceConfigurationMock = require('@verkkokauppa/configuration-backend').getAllPublicServiceConfiguration.mockImplementation(
  () => []
)

const getMerchantModels = require('@verkkokauppa/configuration-backend').getMerchantModels.mockImplementation(
  () => []
)

const validateApiKey = require('@verkkokauppa/configuration-backend').validateApiKey.mockImplementation(
  () => []
)

const updateMerchantController = new (class extends UpdateMerchantController {
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

describe('Test updateMerchantController', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('Should return error if merchant id is given but not found with id', async () => {
    mockMultiMerchantResponses()

    validateApiKey.mockImplementationOnce(() => {
      return true
    })

    const error = await getError(
      async () =>
        await updateMerchantController.implementation(
          {
            params: {
              namespace: 'ns1',
              merchantId: 'not-found-from-mocked-namespace-response',
            },
            headers: { 'api-key': 'test' },
            body: {},
          } as any,
          mockResponse
        )
    )
    // check that the returned error wasn't that no error was thrown
    expect(error).not.toBeInstanceOf(NoErrorThrownError)
    expect(error).toBeInstanceOf(ExperienceError)

    const experienceError = error as ExperienceError
    expect(experienceError.definition).toEqual({
      code: 'failed-to-find-merchant-with-merchant-id',
      message:
        'Failed to find merchant with provided merchantId. merchantToUpdate == null',
      responseStatus: StatusCode.NotFound,
      logLevel: 'info',
    })
  })
})
