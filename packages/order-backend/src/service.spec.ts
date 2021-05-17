import {
  cancelOrder,
  createOrder,
  createOrderWithItems,
  addItemToOrder,
  setCustomerToOrder,
  getOrder,
} from './index'
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

describe('Test Cancel Order', () => {
  it('Should throw error with no backend url set', async () => {
    process.env.ORDER_BACKEND_URL = ''
    await expect(
      cancelOrder({ orderId: '145d8829-07b7-4b03-ab0e-24063958ab9b' })
    ).rejects.toThrow('No order backend URL set')
  })
  it('Should cancel order correctly with backend url set', async () => {
    process.env.ORDER_BACKEND_URL = 'test.dev.hel'
    const mockData = {
      order: {
        orderId: '145d8829-07b7-4b03-ab0e-24063958ab9b',
        namespace: 'testNameSpace',
        user: 'test@test.dev.hel',
        createdAt: '1619157868',
        customerName: 'Customer Name',
        customerEmaiL: 'test@test.dev.hel',
        status: 'cancelled',
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
    axiosMock.get.mockResolvedValue({ data: mockData })
    const result = await cancelOrder({
      orderId: mockData.order.orderId,
    })
    expect(result).toEqual({
      ...mockData.order,
      items: mockData.items,
    })
  })
})

describe('Test Add items to order', () => {
  it('Should throw error with no backend url set', async () => {
    process.env.ORDER_BACKEND_URL = ''
    await expect(
      addItemToOrder({
        orderId: '145d8829-07b7-4b03-ab0e-24063958ab9b',
        items: [],
      })
    ).rejects.toThrow('No order backend URL set')
  })
  it('Should add items correctly to order with backend url set', async () => {
    process.env.ORDER_BACKEND_URL = 'test.dev.hel'
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
    axiosMock.get.mockResolvedValue({ data: mockData })
    const result = await addItemToOrder({
      orderId: mockData.order.orderId,
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
    })
    expect(result).toEqual({
      ...mockData.order,
      items: mockData.items,
    })
  })
})

describe('Test Set Customer To Order', () => {
  it('Should throw error with no backend url set', async () => {
    process.env.ORDER_BACKEND_URL = ''
    await expect(
      setCustomerToOrder({
        orderId: 'e91a3c70-b281-41a5-b6f4-3fd6d12291cf',
        customerName: 'Testi Henkilö',
        customerEmail: 'testi.henkilo@email.com',
      })
    ).rejects.toThrow('No order backend URL set')
  })
  it('Should set customer correctly with backend url set for order without items', async () => {
    process.env.ORDER_BACKEND_URL = 'test.dev.hel'
    const mockData = {
      order: {
        orderId: 'e91a3c70-b281-41a5-b6f4-3fd6d12291cf',
        namespace: 'testNameSpace',
        user: 'test@test.dev.hel',
        createdAt: '1619157868',
        status: 'cancelled',
        customerName: 'Testi Henkilö',
        customerEmail: 'testi.henkilo@email.com',
      },
      items: [],
    }
    axiosMock.post.mockResolvedValue({ data: mockData })
    const result = await setCustomerToOrder({
      orderId: 'e91a3c70-b281-41a5-b6f4-3fd6d12291cf',
      customerName: 'Testi Henkilö',
      customerEmail: 'testi.henkilo@email.com',
    })
    expect(result).toEqual({
      ...mockData.order,
      items: [],
    })
  })
  it('Should set customer correctly with backend url set for order with items', async () => {
    process.env.ORDER_BACKEND_URL = 'test.dev.hel'
    const mockData = {
      order: {
        orderId: 'e91a3c70-b281-41a5-b6f4-3fd6d12291cf',
        namespace: 'testNameSpace',
        user: 'test@test.dev.hel',
        createdAt: '1619157868',
        status: 'cancelled',
        customerName: 'Testi Henkilö',
        customerEmail: 'testi.henkilo@email.com',
      },
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
    }
    axiosMock.post.mockResolvedValue({ data: mockData })
    const result = await setCustomerToOrder({
      orderId: 'e91a3c70-b281-41a5-b6f4-3fd6d12291cf',
      customerName: 'Testi Henkilö',
      customerEmail: 'testi.henkilo@email.com',
    })
    expect(result).toEqual({
      ...mockData.order,
      items: mockData.items,
    })
  })
})

describe('Test Get Order', () => {
  it('Should throw error with no backend url set', async () => {
    process.env.ORDER_BACKEND_URL = ''
    await expect(
      getOrder({ orderId: '145d8829-07b7-4b03-ab0e-24063958ab9b' })
    ).rejects.toThrow('No order backend URL set')
  })
  it('Should get order correctly without items and with backend url set', async () => {
    process.env.ORDER_BACKEND_URL = 'test.dev.hel'
    const mockData = {
      order: {
        orderId: '145d8829-07b7-4b03-ab0e-24063958ab9b',
        namespace: 'testNameSpace',
        user: 'test@test.dev.hel',
        createdAt: '1619157868',
        customerName: 'Customer Name',
        customerEmaiL: 'test@test.dev.hel',
      },
      items: [],
    }
    axiosMock.get.mockResolvedValue({ data: mockData })
    const result = await getOrder({
      orderId: '145d8829-07b7-4b03-ab0e-24063958ab9b',
    })
    expect(result).toEqual({
      ...mockData.order,
      items: [],
    })
  })
  it('Should get order with items correctly with backend url set', async () => {
    process.env.ORDER_BACKEND_URL = 'test.dev.hel'
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
    axiosMock.get.mockResolvedValue({ data: mockData })
    const result = await getOrder({
      orderId: '145d8829-07b7-4b03-ab0e-24063958ab9b',
    })
    expect(result).toEqual({
      ...mockData.order,
      items: mockData.items,
    })
  })
})
