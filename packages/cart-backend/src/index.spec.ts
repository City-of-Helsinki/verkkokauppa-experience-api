import { addItemToCart, createCart, getCart, removeItemFromCart } from './index'
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
    axiosMock.get.mockResolvedValue({ data: mockData })
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
    await expect(getCart({ cartId: 'test' })).rejects.toThrow(
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
    axiosMock.get.mockResolvedValue({ data: mockData })
    const result = await getCart({
      cartId: '145d8829-07b7-4b03-ab0e-24063958ab9b',
    })
    await expect(result).toBe(mockData)
  })
})

describe('Test Add Cart Item', () => {
  it('Should throw error with no backend url set', async () => {
    process.env.CART_BACKEND_URL = ''
    await expect(
      addItemToCart({ cartId: 'test', productId: 'test', quantity: 1 })
    ).rejects.toThrow('No cart backend URL set')
  })
  it('Should add item to cart correctly when backend url set', async () => {
    process.env.CART_BACKEND_URL = 'test.dev.hel'
    const mockData = {
      cart: {
        cartId: '145d8829-07b7-4b03-ab0e-24063958ab9b',
        namespace: 'testNameSpace',
        user: 'test@test.dev.hel',
        createdAt: '1619157868',
      },
      items: [
        {
          cartId: '145d8829-07b7-4b03-ab0e-24063958ab9b',
          cartItemId: '19699acf-b0a3-440f-818f-e582825fa3a7',
          productId: '30a245ed-5fca-4fcf-8b2a-cdf1ce6fca0d',
          quantity: 1,
        },
      ],
    }
    axiosMock.get.mockResolvedValue({ data: mockData })
    const result = await addItemToCart({
      cartId: '145d8829-07b7-4b03-ab0e-24063958ab9b',
      productId: '30a245ed-5fca-4fcf-8b2a-cdf1ce6fca0d',
      quantity: 1,
    })
    await expect(result).toBe(mockData)
  })
})

describe('Test Remove Cart Item', () => {
  it('Should throw error with no backend url set', async () => {
    process.env.CART_BACKEND_URL = ''
    await expect(
      removeItemFromCart({ cartId: 'test', productId: 'test' })
    ).rejects.toThrow('No cart backend URL set')
  })
  it('Should remove item correctly from cart when backend url set', async () => {
    process.env.CART_BACKEND_URL = 'test.dev.hel'
    const mockData = {
      cart: {
        cartId: '145d8829-07b7-4b03-ab0e-24063958ab9b',
        namespace: 'testNameSpace',
        user: 'test@test.dev.hel',
        createdAt: '1619157868',
      },
      items: [],
    }
    axiosMock.get.mockResolvedValue({ data: mockData })
    const result = await removeItemFromCart({
      cartId: '145d8829-07b7-4b03-ab0e-24063958ab9b',
      productId: '30a245ed-5fca-4fcf-8b2a-cdf1ce6fca0d',
    })
    await expect(result).toBe(mockData)
  })
})
