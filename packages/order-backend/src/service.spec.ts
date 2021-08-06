import {
  cancelOrder,
  createOrder,
  createOrderWithItems,
  addItemsToOrder,
  setCustomerToOrder,
  getOrder,
  setOrderTotals,
} from './index'
import axios from 'axios'

jest.mock('axios')
const axiosMock = axios as jest.Mocked<typeof axios>

const orderMock = {
  orderId: '145d8829-07b7-4b03-ab0e-24063958ab9b',
  namespace: 'testNameSpace',
  user: 'test@test.dev.hel',
  createdAt: '1619157868',
}

const orderBackendCustomerMock = {
  customerFirstName: 'Customer',
  customerLastName: 'Name',
  customerEmail: 'test@test.dev.hel',
}

const orderCustomerMock = {
  customer: {
    firstName: 'Customer',
    lastName: 'Name',
    email: 'test@test.dev.hel',
  },
}

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
      ...orderMock,
      items: [],
    }
    axiosMock.get.mockResolvedValue({ data: mockData })
    const result = await createOrder({
      namespace: 'testNameSpace',
      user: 'test@test.dev.hel',
    })
    expect(result).toEqual({
      ...orderMock,
      items: [],
      checkoutUrl: `https://checkout.dev.hel?orderId=${mockData.orderId}`,
    })
  })
  it('Should create order with items correctly with backend url set', async () => {
    process.env.ORDER_BACKEND_URL = 'test.dev.hel'
    process.env.CHECKOUT_BASE_URL = 'https://checkout.dev.hel'
    const mockData = {
      order: {
        ...orderMock,
        ...orderBackendCustomerMock,
        priceNet: '100',
        priceVat: '24',
        priceTotal: '124',
      },
      items: [
        {
          orderId: orderMock.orderId,
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
      priceNet: 100,
      priceVat: 24,
      priceTotal: 124,
      items: [
        {
          productId: '30a245ed-5fca-4fcf-8b2a-cdf1ce6fca0d',
          quantity: 1,
          productName: 'Product Name',
          unit: 'pcs',
          rowPriceNet: '100',
          rowPriceVat: '24',
          rowPriceTotal: '124',
        },
      ],
      ...orderCustomerMock,
    })
    expect(result).toEqual({
      ...orderMock,
      ...orderCustomerMock,
      priceNet: '100',
      priceVat: '24',
      priceTotal: '124',
      items: mockData.items,
      checkoutUrl: `https://checkout.dev.hel?orderId=${mockData.order.orderId}`,
    })
  })
})

describe('Test Cancel Order', () => {
  it('Should throw error with no backend url set', async () => {
    process.env.ORDER_BACKEND_URL = ''
    await expect(cancelOrder({ orderId: orderMock.orderId })).rejects.toThrow(
      'No order backend URL set'
    )
  })
  it('Should cancel order correctly with backend url set', async () => {
    process.env.ORDER_BACKEND_URL = 'test.dev.hel'
    const mockData = {
      order: {
        ...orderMock,
        ...orderBackendCustomerMock,
        status: 'cancelled',
      },
      items: [
        {
          orderId: orderMock.orderId,
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
      ...orderMock,
      ...orderCustomerMock,
      status: 'cancelled',
      items: mockData.items,
      checkoutUrl: `${process.env.CHECKOUT_BASE_URL}?orderId=${mockData.order.orderId}`,
    })
  })
})

describe('Test Add items to order', () => {
  it('Should throw error with no backend url set', async () => {
    process.env.ORDER_BACKEND_URL = ''
    await expect(
      addItemsToOrder({
        orderId: orderMock.orderId,
        items: [],
      })
    ).rejects.toThrow('No order backend URL set')
  })
  it('Should add items correctly to order with backend url set', async () => {
    process.env.ORDER_BACKEND_URL = 'test.dev.hel'
    const mockData = {
      order: {
        ...orderMock,
        ...orderBackendCustomerMock,
      },
      items: [
        {
          orderId: orderMock.orderId,
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
    const result = await addItemsToOrder({
      orderId: mockData.order.orderId,
      items: [
        {
          productId: '30a245ed-5fca-4fcf-8b2a-cdf1ce6fca0d',
          quantity: 1,
          productName: 'Product Name',
          unit: 'pcs',
          rowPriceNet: '100',
          rowPriceVat: '24',
          rowPriceTotal: '124',
        },
      ],
    })
    expect(result).toEqual({
      ...orderMock,
      ...orderCustomerMock,
      items: mockData.items,
      checkoutUrl: `${process.env.CHECKOUT_BASE_URL}?orderId=${mockData.order.orderId}`,
    })
  })
})

describe('Test Set Customer To Order', () => {
  it('Should throw error with no backend url set', async () => {
    process.env.ORDER_BACKEND_URL = ''
    await expect(
      setCustomerToOrder({
        orderId: orderMock.orderId,
        ...orderCustomerMock,
      })
    ).rejects.toThrow('No order backend URL set')
  })
  it('Should set customer correctly with backend url set for order without items', async () => {
    process.env.ORDER_BACKEND_URL = 'test.dev.hel'
    const mockData = {
      order: {
        ...orderMock,
        ...orderBackendCustomerMock,
      },
      items: [],
    }
    axiosMock.post.mockResolvedValue({ data: mockData })
    const result = await setCustomerToOrder({
      orderId: orderMock.orderId,
      ...orderCustomerMock,
    })
    expect(result).toEqual({
      ...orderMock,
      ...orderCustomerMock,
      items: [],
      checkoutUrl: `${process.env.CHECKOUT_BASE_URL}?orderId=${mockData.order.orderId}`,
    })
  })
  it('Should set customer correctly with backend url set for order with items', async () => {
    process.env.ORDER_BACKEND_URL = 'test.dev.hel'
    const mockData = {
      order: {
        ...orderMock,
        ...orderBackendCustomerMock,
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
      orderId: orderMock.orderId,
      ...orderCustomerMock,
    })
    expect(result).toEqual({
      ...orderMock,
      ...orderCustomerMock,
      items: mockData.items,
      checkoutUrl: `${process.env.CHECKOUT_BASE_URL}?orderId=${mockData.order.orderId}`,
    })
  })
})

describe('Test Get Order', () => {
  it('Should throw error with no backend url set', async () => {
    process.env.ORDER_BACKEND_URL = ''
    await expect(getOrder({ orderId: orderMock.orderId })).rejects.toThrow(
      'No order backend URL set'
    )
  })
  it('Should get order correctly without items and with backend url set', async () => {
    process.env.ORDER_BACKEND_URL = 'test.dev.hel'
    const mockData = {
      order: {
        ...orderMock,
        ...orderBackendCustomerMock,
      },
      items: [],
    }
    axiosMock.get.mockResolvedValue({ data: mockData })
    const result = await getOrder({
      orderId: orderMock.orderId,
    })
    expect(result).toEqual({
      ...orderMock,
      ...orderCustomerMock,
      items: [],
      checkoutUrl: `${process.env.CHECKOUT_BASE_URL}?orderId=${mockData.order.orderId}`,
    })
  })
  it('Should get order with items correctly with backend url set', async () => {
    process.env.ORDER_BACKEND_URL = 'test.dev.hel'
    const mockData = {
      order: {
        ...orderMock,
        ...orderBackendCustomerMock,
      },
      items: [
        {
          orderId: orderMock.orderId,
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
      orderId: orderMock.orderId,
    })
    expect(result).toEqual({
      ...orderMock,
      ...orderCustomerMock,
      items: mockData.items,
      checkoutUrl: `${process.env.CHECKOUT_BASE_URL}?orderId=${mockData.order.orderId}`,
    })
  })
})

describe('Test Calculate Totals for Order', () => {
  it('Should throw error with no backend url set', async () => {
    process.env.ORDER_BACKEND_URL = ''
    await expect(
      setOrderTotals({
        orderId: 'test',
        priceNet: '0',
        priceVat: '0',
        priceTotal: '0',
      })
    ).rejects.toThrow('No order backend URL set')
  })
  it('Should set zero totals for order correctly with backend url set', async () => {
    process.env.ORDER_BACKEND_URL = 'test.dev.hel'
    process.env.CHECKOUT_BASE_URL = 'https://checkout.dev.hel'
    const mockData = {
      order: {
        ...orderMock,
        priceNet: '0',
        priceVat: '0',
        priceTotal: '0',
      },
      items: [],
    }
    axiosMock.post.mockResolvedValue({ data: mockData })
    const result = await setOrderTotals({
      orderId: mockData.order.orderId,
      priceNet: 0,
      priceVat: 0,
      priceTotal: 0,
    })
    expect(result).toEqual({
      ...orderMock,
      items: [],
      customer: undefined,
      status: undefined,
      priceNet: '0',
      priceVat: '0',
      priceTotal: '0',
      checkoutUrl: `${process.env.CHECKOUT_BASE_URL}?orderId=${mockData.order.orderId}`,
    })
  })
  it('Should set totals for order with items correctly with backend url set', async () => {
    process.env.ORDER_BACKEND_URL = 'test.dev.hel'
    process.env.CHECKOUT_BASE_URL = 'https://checkout.dev.hel'
    const mockData = {
      order: {
        ...orderMock,
        ...orderBackendCustomerMock,
        priceNet: '100',
        priceVat: '24',
        priceTotal: '124',
      },
      items: [
        {
          orderId: orderMock.orderId,
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
    const result = await setOrderTotals({
      orderId: orderMock.orderId,
      priceNet: 100,
      priceVat: 24,
      priceTotal: 124,
    })
    expect(result).toEqual({
      ...orderMock,
      ...orderCustomerMock,
      items: mockData.items,
      priceNet: '100',
      priceVat: '24',
      priceTotal: '124',
      checkoutUrl: `https://checkout.dev.hel?orderId=${mockData.order.orderId}`,
    })
  })
})
