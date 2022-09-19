import { createProductMapping, getProductMapping } from './index'
import axios from 'axios'

jest.mock('axios')
const axiosMock = axios as jest.Mocked<typeof axios>

describe('Test Product Mapping from backend', () => {
  it('Should throw error with no backend url set', async () => {
    process.env.PRODUCT_MAPPING_BACKEND_URL = ''
    await expect(getProductMapping({ productId: 'test' })).rejects.toThrow(
      'No product mapping backend URL set'
    )
  })
  it('Should fetch correctly with backend url set', async () => {
    process.env.PRODUCT_MAPPING_BACKEND_URL = 'test.dev.hel'
    const mockData = {
      productId: 'test',
      namespace: 'testnamespace',
      namespaceEntityId: '123',
      merchantId: '321',
    }
    axiosMock.get.mockResolvedValue({ data: mockData })
    const result = await getProductMapping({ productId: 'test' })
    await expect(result).toBe(mockData)
  })
})

describe('Test Create Product Mapping', () => {
  it('Should throw error with no backend url set', async () => {
    process.env.PRODUCT_MAPPING_BACKEND_URL = ''
    await expect(
      createProductMapping({
        namespace: 'testnamespace',
        namespaceEntityId: '123',
        merchantId: '321',
      })
    ).rejects.toThrow('No product mapping backend URL set')
  })
  it('Should create correctly with backend url set', async () => {
    process.env.PRODUCT_MAPPING_BACKEND_URL = 'test.dev.hel'
    const mockData = {
      productId: 'test',
      namespace: 'testnamespace',
      namespaceEntityId: '123',
      merchantId: '321',
    }
    axiosMock.get.mockResolvedValue({ data: mockData })
    const result = await createProductMapping({
      namespace: mockData.namespace,
      namespaceEntityId: mockData.namespaceEntityId,
      merchantId: mockData.merchantId,
    })
    await expect(result).toBe(mockData)
  })
})
