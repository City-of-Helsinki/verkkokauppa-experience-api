import { createCart, getCart } from './index'
import axios from 'axios'

jest.mock('axios')
const axiosMock = axios as jest.Mocked<typeof axios>

describe('Test Create Cart from backend', () => {
  it('Should throw error with no backend url set', async () => {
    process.env.CART_BACKEND_URL = ''
    await expect(
      createCart({ namespace: 'test', user: 'test' })
    ).rejects.toThrow('No cart backend URL set')
  })
  it('Should create cart correctly with backend url set', async () => {
    process.env.CART_BACKEND_URL = 'test.dev.hel'
    const mockData = {
      cartId: '145d8829-07b7-4b03-ab0e-24063958ab9b',
      namespace: 'testNameSpace',
      user: 'test@test.dev.hel',
      createdAt: '1619157868',
    }
    axiosMock.get.mockResolvedValue(mockData)
    const result = await createCart({
      namespace: 'testNameSpace',
      user: 'test@test.dev.hel',
    })
    await expect(result).toBe(mockData)
  })
})

describe('Test Get Cart from backend', () => {
  it('Should throw error with no backend url set', async () => {
    process.env.CART_BACKEND_URL = ''
    await expect(getCart({ id: 'test' })).rejects.toThrow(
      'No cart backend URL set'
    )
  })
  it('Should get cart correctly with backend url set', async () => {
    process.env.CART_BACKEND_URL = 'test.dev.hel'
    const mockData = {
      cartId: '145d8829-07b7-4b03-ab0e-24063958ab9b',
      namespace: 'testNameSpace',
      user: 'test@test.dev.hel',
      createdAt: '1619157868',
    }
    axiosMock.get.mockResolvedValue(mockData)
    const result = await getCart({
      id: '145d8829-07b7-4b03-ab0e-24063958ab9b',
    })
    await expect(result).toBe(mockData)
  })
})
