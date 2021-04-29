import { getProduct } from './index'
import axios from 'axios'

jest.mock('axios')
const axiosMock = axios as jest.Mocked<typeof axios>

describe('Test Single Product from backend', () => {
  it('Should throw error with no backend url set', async () => {
    process.env.PRODUCT_BACKEND_URL = ''
    await expect(getProduct({ productId: 'test' })).rejects.toThrow(
      'No product backend URL set'
    )
  })
  it('Should fetch correctly with backend url set', async () => {
    process.env.PRODUCT_BACKEND_URL = 'test.dev.hel'
    const mockData = { productId: 'test', name: 'Test' }
    axiosMock.get.mockResolvedValue({ data: mockData })
    const result = await getProduct({ productId: 'test' })
    await expect(result).toBe(mockData)
  })
})
