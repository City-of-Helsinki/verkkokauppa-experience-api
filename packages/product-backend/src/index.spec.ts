import { createProductAccounting, getProduct } from './index'
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

describe('Test Create Accounting info', () => {
  const productAccounting = {
    productId: 'productId',
    vatCode: 'vatCode',
    internalOrder: 'internalOrder',
    profitCenter: 'profitCenter',
    project: 'project',
    operationArea: 'operationArea',
  }
  it('Should throw error with no backend url set', async () => {
    process.env.PRODUCT_BACKEND_URL = ''
    await expect(
      createProductAccounting({
        productAccounting,
      })
    ).rejects.toThrow('No product backend URL set')
  })
  it('Should create accouting info correctly with backend url set', async () => {
    process.env.PRODUCT_BACKEND_URL = 'test.dev.hel'
    const mockData = Object.assign({}, productAccounting)
    axiosMock.post.mockResolvedValue({ data: productAccounting })
    const result = await createProductAccounting({ productAccounting })
    await expect(result).toBe(mockData)
  })
})
