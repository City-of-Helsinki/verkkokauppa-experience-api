import {
  getAllPublicServiceConfiguration,
  getAllRestrictedServiceConfiguration,
  getPublicServiceConfiguration,
  getRestrictedServiceConfiguration,
  validateApiKey,
} from './service'
import axios from 'axios'

jest.mock('axios')
const axiosMock = axios as jest.Mocked<typeof axios>

beforeEach(() => {
  jest.clearAllMocks()
})

describe('Test Configurations from backend', () => {
  it('Should throw error with no backend url set', async () => {
    process.env.CONFIGURATION_BACKEND_URL = ''
    await expect(
      getAllPublicServiceConfiguration({ namespace: 'test' })
    ).rejects.toThrow('No configuration backend URL set')
    await expect(
      getPublicServiceConfiguration({
        namespace: 'test',
        key: 'TERMS_OF_USE_URL',
      })
    ).rejects.toThrow('No configuration backend URL set')
    await expect(
      getAllRestrictedServiceConfiguration({
        namespace: 'test',
      })
    ).rejects.toThrow('No configuration backend URL set')
    await expect(
      getRestrictedServiceConfiguration({
        namespace: 'test',
        key: 'PAYMENT_API_KEY',
      })
    ).rejects.toThrow('No configuration backend URL set')
  })
  it('Should fetch all public configurations correctly with backend url set', async () => {
    process.env.CONFIGURATION_BACKEND_URL = 'test.dev.hel'
    const mockData = [
      {
        configurationId: '2f815a93-4c5c-442f-ba09-f294ecc12679',
        namespace: 'test',
        configurationKey: 'TERMS_OF_USE_URL',
        configurationValue: 'test.com',
        restricted: false,
      },
    ]
    axiosMock.get.mockResolvedValue({ data: mockData })
    const result = await getAllPublicServiceConfiguration({ namespace: 'test' })
    await expect(result).toBe(mockData)
  })
  it('Should fetch single public configuration correctly with backend url set', async () => {
    process.env.CONFIGURATION_BACKEND_URL = 'test.dev.hel'
    const mockData = {
      configurationId: '2f815a93-4c5c-442f-ba09-f294ecc12679',
      namespace: 'test',
      configurationKey: 'TERMS_OF_USE_URL',
      configurationValue: 'test.com',
      restricted: false,
    }

    axiosMock.get.mockResolvedValue({ data: mockData })
    const result = await getPublicServiceConfiguration({
      namespace: 'test',
      key: 'TERMS_OF_USE_URL',
    })
    await expect(result).toBe(mockData)
  })
  it('Should fetch all restricted configurations correctly with backend url set', async () => {
    process.env.CONFIGURATION_BACKEND_URL = 'test.dev.hel'
    const mockData = [
      {
        configurationId: '2f815a93-4c5c-442f-ba09-f294ecc12679',
        namespace: 'test',
        configurationKey: 'PAYMENT_API_KEY',
        configurationValue: 'test.com',
        restricted: false,
      },
    ]
    axiosMock.get.mockResolvedValue({ data: mockData })
    const result = await getAllRestrictedServiceConfiguration({
      namespace: 'test',
    })
    await expect(result).toBe(mockData)
  })
  it('Should fetch single restricted configurations correctly with backend url set', async () => {
    process.env.CONFIGURATION_BACKEND_URL = 'test.dev.hel'
    const mockData = {
      configurationId: '2f815a93-4c5c-442f-ba09-f294ecc12679',
      namespace: 'test',
      configurationKey: 'PAYMENT_API_KEY',
      configurationValue: 'test.com',
      restricted: false,
    }

    axiosMock.get.mockResolvedValue({ data: mockData })
    const result = await getRestrictedServiceConfiguration({
      namespace: 'test',
      key: 'PAYMENT_API_KEY',
    })
    await expect(result).toBe(mockData)
  })
})

describe('Test validateApiKey', () => {
  const baseUrl = 'test.dev.hel'
  process.env.CONFIGURATION_BACKEND_URL = baseUrl
  const p = { namespace: 'ns1', apiKey: 'ak1' }
  it('Should call /api-access/validate', async () => {
    axiosMock.get.mockResolvedValue({ data: true })
    await validateApiKey(p)
    expect(axiosMock.get).toHaveBeenCalledTimes(1)
    expect(axiosMock.get.mock.calls[0]![0]).toEqual(
      `${baseUrl}/api-access/validate`
    )
    expect(axiosMock.get.mock.calls[0]![1]).toEqual({
      params: {
        namespace: 'ns1',
        token: 'ak1',
      },
    })
  })
  it('Should throw failed-to-validate-api-key error for unknown errors', async () => {
    axiosMock.get.mockRejectedValue(undefined)
    await expect(validateApiKey(p)).rejects.toThrow(
      /failed-to-validate-api-key/
    )
  })
  it('Should throw api-key-validation-failed error for unsuccessful validation', async () => {
    axiosMock.get.mockResolvedValue({ data: false })
    await expect(validateApiKey(p)).rejects.toThrow(/api-key-validation-failed/)
  })
  it('Should return undefined for successful validation', async () => {
    axiosMock.get.mockResolvedValue({ data: true })
    const res = await validateApiKey(p)
    expect(res).toEqual(undefined)
  })
})
