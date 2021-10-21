import type { Response } from 'express'
import { Onboarding } from './onboarding'
import { AbstractController } from '@verkkokauppa/core'

jest.mock('@verkkokauppa/configuration-backend')

const createPublicServiceConfigurationsMock = require('@verkkokauppa/configuration-backend').createPublicServiceConfigurations.mockImplementation(
  () => []
)

const onboarding = new (class extends Onboarding {
  schema = this.requestSchema
  implementation(req: any, res: Response): Promise<any> {
    return super.implementation(req, res)
  }
})()

const mockResponse = ({
  get: () => ({}),
  status: () => ({ json: () => ({}) }),
} as any) as Response

describe('Test onboarding', () => {
  describe('Schema', () => {
    it('Should require params.namespace', async () => {
      await expect(onboarding.schema.validate({})).rejects.toMatchObject({
        errors: ['params.namespace is a required field'],
      })
    })
    it('Should validate merchant keys to be of type string', async () => {
      const merchantKeys = [
        'merchantName',
        'merchantStreet',
        'merchantZip',
        'merchantCity',
        'merchantEmail',
        'merchantPhone',
        'merchantUrl',
        'merchantTermsOfServiceUrl',
        'merchantBusinessId',
        'orderCreatedRedirectUrl',
      ]
      await Promise.all(
        merchantKeys.map(async (k) => {
          await expect(
            onboarding.schema.validate({
              params: { namespace: 'ns1' },
              body: { [k]: [] },
            })
          ).rejects.toMatchObject({
            errors: [
              `body.${k} must be a \`string\` type, but the final value was: \`[]\`.`,
            ],
          })
        })
      )
    })
    it('Should strip unknown merchant keys', async () => {
      await expect(
        onboarding.schema.validate({
          params: { namespace: 'ns1' },
          body: { k: 'v' },
        })
      ).resolves.toEqual({ params: { namespace: 'ns1' }, body: {} })
    })
  })
  it('Should call createPublicServiceConfigurations', async () => {
    await onboarding.implementation(
      {
        params: { namespace: 'ns1' },
        body: {
          merchantName: 'mn1',
          merchantStreet: 'ms1',
          orderCreatedRedirectUrl: 'ocr.url',
        },
      },
      mockResponse
    )
    expect(createPublicServiceConfigurationsMock).toHaveBeenCalledTimes(1)
    expect(createPublicServiceConfigurationsMock.mock.calls[0][0]).toEqual({
      namespace: 'ns1',
      configurations: {
        merchantName: 'mn1',
        merchantStreet: 'ms1',
        ORDER_CREATED_REDIRECT_URL: 'ocr.url',
      },
    })
  })
  it('Should return configuration map with known keys', async () => {
    const createdSpy = jest.spyOn(AbstractController.prototype, 'created')
    createPublicServiceConfigurationsMock.mockImplementationOnce(() => [
      { configurationKey: 'merchantName', configurationValue: 'mn1' },
      { configurationKey: 'merchantStreet', configurationValue: 'ms1' },
      {
        configurationKey: 'ORDER_CREATED_REDIRECT_URL',
        configurationValue: 'ocr.url',
      },
      { configurationKey: 'unknown', configurationValue: 'unknown' },
    ])
    await onboarding.implementation(
      { params: { namespace: 'ns1' } } as any,
      mockResponse
    )
    expect(createdSpy).toHaveBeenCalledTimes(1)
    expect(createdSpy.mock.calls[0]![0]).toBe(mockResponse)
    expect(createdSpy.mock.calls[0]![1]).toEqual({
      merchantName: 'mn1',
      merchantStreet: 'ms1',
      orderCreatedRedirectUrl: 'ocr.url',
    })
  })
})
