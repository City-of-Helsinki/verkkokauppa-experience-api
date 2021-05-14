import { createOrder, createOrderWithItems } from './index'
import axios from 'axios'

jest.mock('axios')
const axiosMock = axios as jest.Mocked<typeof axios>

describe('Test Create Order', () => {
  it('Should throw error with no backend url set', async () => {
    process.env.ORDER_BACKEND_URL = ''
    await expect(
      createOrder({ namespace: 'asiakaspysakointi', user: 'test' })
    ).rejects.toThrow('No order backend URL set')
  })
  it('Should create order correctly with backend url set', async () => {
    process.env.ORDER_BACKEND_URL = 'test.dev.hel'
    process.env.CHECKOUT_BASE_URL = 'https://checkout.dev.hel'
    const mockData = {
      orderId: '145d8829-07b7-4b03-ab0e-24063958ab9b',
      namespace: 'testNameSpace',
      user: 'test@test.dev.hel',
      createdAt: '1619157868',
      items: [],
    }
    axiosMock.get.mockResolvedValue({ data: mockData })
    const result = await createOrder({
      namespace: 'testNameSpace',
      user: 'test@test.dev.hel',
    })
    expect(result).toEqual({
      ...mockData,
      checkoutUrl: `https://checkout.dev.hel?orderId=${mockData.orderId}`,
    })
  })
  it('Should create order with items correctly with backend url set', async () => {
    process.env.ORDER_BACKEND_URL = 'test.dev.hel'
    process.env.CHECKOUT_BASE_URL = 'https://checkout.dev.hel'
    const mockData = {
      order: {
        orderId: '145d8829-07b7-4b03-ab0e-24063958ab9b',
        namespace: 'testNameSpace',
        user: 'test@test.dev.hel',
        createdAt: '1619157868',
        customerName: 'Customer Name',
        customerEmaiL: 'test@test.dev.hel',
      },
      items: [
        {
          orderId: '145d8829-07b7-4b03-ab0e-24063958ab9b',
          orderItemId: '19699acf-b0a3-440f-818f-e582825fa3a7',
          productId: '30a245ed-5fca-4fcf-8b2a-cdf1ce6fca0d',
          quantity: 1,
          productName: 'Product Name',
          unit: 'pcs',
          rowPriceNet: '100',
          rowPriceVat: '24',
          rowPriceTotal: '124',
        },
      ],
    }
    axiosMock.post.mockResolvedValue({ data: mockData })
    const result = await createOrderWithItems({
      namespace: 'testNameSpace',
      user: 'test@test.dev.hel',
      items: [
        {
          productId: '30a245ed-5fca-4fcf-8b2a-cdf1ce6fca0d',
          quantity: 1,
          productName: 'Product Name',
          unit: 'pcs',
          rowPriceNet: 100,
          rowPriceVat: 24,
          rowPriceTotal: 124,
        },
      ],
      customer: {
        email: 'test@test.dev.hel',
        name: 'Customer Name',
      },
    })
    expect(result).toEqual({
      ...mockData.order,
      items: mockData.items,
      checkoutUrl: `https://checkout.dev.hel?orderId=${mockData.order.orderId}`,
    })
  })
})
