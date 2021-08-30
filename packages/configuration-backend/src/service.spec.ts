import {
  getAllPublicServiceConfiguration,
  getAllRestrictedServiceConfiguration,
  getPublicServiceConfiguration,
  getRestrictedServiceConfiguration,
} from './service'
import axios from 'axios'

jest.mock('axios')
const axiosMock = axios as jest.Mocked<typeof axios>

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
