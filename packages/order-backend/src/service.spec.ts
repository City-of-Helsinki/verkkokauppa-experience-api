import {
  cancelOrder,
  createOrder,
  createOrderWithItems,
  addItemsToOrder,
  setCustomerToOrder,
  getOrder,
  setOrderTotals,
  createAccountingEntryForOrder,
  setInvoiceToOrder,
} from './index'
import axios from 'axios'

jest.mock('axios')
const axiosMock = axios as jest.Mocked<typeof axios>

const orderMock = {
  orderId: '145d8829-07b7-4b03-ab0e-24063958ab9b',
  namespace: 'testNameSpace',
  user: 'test@test.dev.hel',
  createdAt: '1619157868',
  type: 'order',
  status: 'draft',
  customer: undefined,
  invoice: undefined,
  subscriptionId: undefined,
}

const orderBackendCustomerMock = {
  customerFirstName: 'Customer',
  customerLastName: 'Name',
  customerEmail: 'test@test.dev.hel',
  customerPhone: '+358401231233',
}

const orderBackendInvoiceMock = {
  invoice: {
    businessId: 'businessId',
    name: 'name',
    address: 'address',
    postcode: 'postcode',
    city: 'city',
    ovtId: 'ovtId',
  },
}

const orderCustomerMock = {
  customer: {
    firstName: 'Customer',
    lastName: 'Name',
    email: 'test@test.dev.hel',
    phone: '+358401231233',
  },
}

const orderInvoiceMock = {
  invoice: {
    businessId: 'businessId',
    name: 'name',
    address: 'address',
    postcode: 'postcode',
    city: 'city',
    ovtId: 'ovtId',
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
    process.env.CHECKOUT_BASE_URL = 'https://checkout.dev.hel/'
    const mockData = {
      order: orderMock,
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
      updateCardUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}/update-card?user=${mockData.order.user}`,
      checkoutUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}`,
      receiptUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}/receipt?user=${mockData.order.user}`,
      loggedInCheckoutUrl: `${process.env.CHECKOUT_BASE_URL}profile/${mockData.order.orderId}`,
    })
  })
  it('Should create order with items correctly with backend url set', async () => {
    process.env.ORDER_BACKEND_URL = 'test.dev.hel'
    process.env.CHECKOUT_BASE_URL = 'https://checkout.dev.hel/'
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
          quantity: 2,
          productName: 'Product Name',
          productLabel: 'Product Label',
          productDescription: 'Product Description',
          unit: 'pcs',
          rowPriceNet: '100',
          rowPriceVat: '24',
          rowPriceTotal: '124',
          priceNet: '50',
          priceGross: '62',
          priceVat: '12',
          vatPercentage: '24',
        },
      ],
    }
    axiosMock.post.mockResolvedValue({ data: mockData })
    const result = await createOrderWithItems({
      namespace: 'testNameSpace',
      user: 'test@test.dev.hel',
      priceNet: '100',
      priceVat: '24',
      priceTotal: '124',
      items: [
        {
          productId: '30a245ed-5fca-4fcf-8b2a-cdf1ce6fca0d',
          quantity: 2,
          productName: 'Product Name',
          productLabel: 'Product Label',
          productDescription: 'Product Description',
          unit: 'pcs',
          rowPriceNet: '100',
          rowPriceVat: '24',
          rowPriceTotal: '124',
          priceNet: '50',
          priceGross: '62',
          priceVat: '12',
          vatPercentage: '24',
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
      updateCardUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}/update-card?user=${mockData.order.user}`,
      checkoutUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}`,
      receiptUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}/receipt?user=${mockData.order.user}`,
      loggedInCheckoutUrl: `${process.env.CHECKOUT_BASE_URL}profile/${mockData.order.orderId}`,
    })
  })
})

describe('Test Cancel Order', () => {
  it('Should throw error with no backend url set', async () => {
    process.env.ORDER_BACKEND_URL = ''
    await expect(
      cancelOrder({ orderId: orderMock.orderId, user: orderMock.user })
    ).rejects.toThrow('No order backend URL set')
  })
  it('Should cancel order correctly with backend url set', async () => {
    process.env.ORDER_BACKEND_URL = 'test.dev.hel'
    process.env.CHECKOUT_BASE_URL = 'https://checkout.dev.hel/'
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
          productLabel: 'Product Label',
          productDescription: 'Product Description',
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
      user: mockData.order.user,
    })
    expect(result).toEqual({
      ...orderMock,
      ...orderCustomerMock,
      status: 'cancelled',
      items: mockData.items,
      updateCardUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}/update-card?user=${mockData.order.user}`,
      checkoutUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}`,
      receiptUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}/receipt?user=${mockData.order.user}`,
      loggedInCheckoutUrl: `${process.env.CHECKOUT_BASE_URL}profile/${mockData.order.orderId}`,
    })
  })
})

describe('Test Add items to order', () => {
  it('Should throw error with no backend url set', async () => {
    process.env.ORDER_BACKEND_URL = ''
    await expect(
      addItemsToOrder({
        orderId: orderMock.orderId,
        user: orderMock.user,
        items: [],
      })
    ).rejects.toThrow('No order backend URL set')
  })
  it('Should add items correctly to order with backend url set', async () => {
    process.env.ORDER_BACKEND_URL = 'test.dev.hel'
    process.env.CHECKOUT_BASE_URL = 'https://checkout.dev.hel/'
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
          quantity: 2,
          productName: 'Product Name',
          productLabel: 'Product Label',
          productDescription: 'Product Description',
          unit: 'pcs',
          rowPriceNet: '100',
          rowPriceVat: '24',
          rowPriceTotal: '124',
          priceNet: '50',
          priceGross: '62',
          priceVat: '12',
          vatPercentage: '24',
        },
      ],
    }
    axiosMock.post.mockResolvedValue({ data: mockData })
    const result = await addItemsToOrder({
      orderId: mockData.order.orderId,
      user: mockData.order.user,
      items: [
        {
          productId: '30a245ed-5fca-4fcf-8b2a-cdf1ce6fca0d',
          quantity: 2,
          productName: 'Product Name',
          productLabel: 'Product Label',
          productDescription: 'Product Description',
          unit: 'pcs',
          rowPriceNet: '100',
          rowPriceVat: '24',
          rowPriceTotal: '124',
          priceNet: '50',
          priceGross: '62',
          priceVat: '12',
          vatPercentage: '24',
        },
      ],
    })
    expect(result).toEqual({
      ...orderMock,
      ...orderCustomerMock,
      items: mockData.items,
      updateCardUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}/update-card?user=${mockData.order.user}`,
      checkoutUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}`,
      receiptUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}/receipt?user=${mockData.order.user}`,
      loggedInCheckoutUrl: `${process.env.CHECKOUT_BASE_URL}profile/${mockData.order.orderId}`,
    })
  })
})

describe('Test Set Customer To Order', () => {
  it('Should throw error with no backend url set', async () => {
    process.env.ORDER_BACKEND_URL = ''
    await expect(
      setCustomerToOrder({
        orderId: orderMock.orderId,
        user: orderMock.user,
        ...orderCustomerMock,
      })
    ).rejects.toThrow('No order backend URL set')
  })
  it('Should set customer correctly with backend url set for order without items', async () => {
    process.env.ORDER_BACKEND_URL = 'test.dev.hel'
    process.env.CHECKOUT_BASE_URL = 'https://checkout.dev.hel/'
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
      user: orderMock.user,
      ...orderCustomerMock,
    })
    expect(result).toEqual({
      ...orderMock,
      ...orderCustomerMock,
      items: [],
      updateCardUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}/update-card?user=${mockData.order.user}`,
      checkoutUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}`,
      receiptUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}/receipt?user=${mockData.order.user}`,
      loggedInCheckoutUrl: `${process.env.CHECKOUT_BASE_URL}profile/${mockData.order.orderId}`,
    })
  })
  it('Should set customer correctly with backend url set for order with items', async () => {
    process.env.ORDER_BACKEND_URL = 'test.dev.hel'
    process.env.CHECKOUT_BASE_URL = 'https://checkout.dev.hel/'
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
          productLabel: 'Product Label',
          productDescription: 'Product Description',
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
      user: orderMock.user,
      ...orderCustomerMock,
    })
    expect(result).toEqual({
      ...orderMock,
      ...orderCustomerMock,
      items: mockData.items,
      updateCardUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}/update-card?user=${mockData.order.user}`,
      checkoutUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}`,
      receiptUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}/receipt?user=${mockData.order.user}`,
      loggedInCheckoutUrl: `${process.env.CHECKOUT_BASE_URL}profile/${mockData.order.orderId}`,
    })
  })
})

describe('Test Set Invoice To Order', () => {
  it('Should throw error with no backend url set', async () => {
    process.env.ORDER_BACKEND_URL = ''
    await expect(
      setInvoiceToOrder({
        orderId: orderMock.orderId,
        user: orderMock.user,
        ...orderInvoiceMock,
      })
    ).rejects.toThrow('No order backend URL set')
  })
  it('Should set invoice correctly with backend url set for order without items', async () => {
    process.env.ORDER_BACKEND_URL = 'test.dev.hel'
    process.env.CHECKOUT_BASE_URL = 'https://checkout.dev.hel/'
    const mockData = {
      order: {
        ...orderMock,
        ...orderBackendInvoiceMock,
      },
      items: [],
    }
    axiosMock.post.mockResolvedValue({ data: mockData })
    const result = await setInvoiceToOrder({
      orderId: orderMock.orderId,
      user: orderMock.user,
      ...orderInvoiceMock,
    })
    expect(result).toEqual({
      ...orderMock,
      ...orderInvoiceMock,
      items: [],
      updateCardUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}/update-card?user=${mockData.order.user}`,
      checkoutUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}`,
      receiptUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}/receipt?user=${mockData.order.user}`,
      loggedInCheckoutUrl: `${process.env.CHECKOUT_BASE_URL}profile/${mockData.order.orderId}`,
    })
  })

  it('Should set invoice correctly with backend url set for order with items', async () => {
    process.env.ORDER_BACKEND_URL = 'test.dev.hel'
    process.env.CHECKOUT_BASE_URL = 'https://checkout.dev.hel/'
    const mockData = {
      order: {
        ...orderMock,
        ...orderBackendInvoiceMock,
      },
      items: [
        {
          productId: '30a245ed-5fca-4fcf-8b2a-cdf1ce6fca0d',
          quantity: 1,
          productName: 'Product Name',
          productLabel: 'Product Label',
          productDescription: 'Product Description',
          unit: 'pcs',
          rowPriceNet: 100,
          rowPriceVat: 24,
          rowPriceTotal: 124,
        },
      ],
    }
    axiosMock.post.mockResolvedValue({ data: mockData })
    const result = await setInvoiceToOrder({
      orderId: orderMock.orderId,
      user: orderMock.user,
      ...orderInvoiceMock,
    })
    expect(result).toEqual({
      ...orderMock,
      ...orderInvoiceMock,
      items: mockData.items,
      updateCardUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}/update-card?user=${mockData.order.user}`,
      checkoutUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}`,
      receiptUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}/receipt?user=${mockData.order.user}`,
      loggedInCheckoutUrl: `${process.env.CHECKOUT_BASE_URL}profile/${mockData.order.orderId}`,
    })
  })
})

describe('Test Get Order', () => {
  it('Should throw error with no backend url set', async () => {
    process.env.ORDER_BACKEND_URL = ''
    await expect(
      getOrder({ orderId: orderMock.orderId, user: orderMock.user })
    ).rejects.toThrow('No order backend URL set')
  })
  it('Should get order correctly without items and with backend url set', async () => {
    process.env.ORDER_BACKEND_URL = 'test.dev.hel'
    process.env.CHECKOUT_BASE_URL = 'https://checkout.dev.hel/'
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
      user: orderMock.user,
    })
    expect(result).toEqual({
      ...orderMock,
      ...orderCustomerMock,
      items: [],
      updateCardUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}/update-card?user=${mockData.order.user}`,
      checkoutUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}`,
      receiptUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}/receipt?user=${mockData.order.user}`,
      loggedInCheckoutUrl: `${process.env.CHECKOUT_BASE_URL}profile/${mockData.order.orderId}`,
    })
  })
  it('Should get order with items correctly with backend url set', async () => {
    process.env.ORDER_BACKEND_URL = 'test.dev.hel'
    process.env.CHECKOUT_BASE_URL = 'https://checkout.dev.hel/'
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
          productLabel: 'Product Label',
          productDescription: 'Product Description',
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
      user: orderMock.user,
    })
    expect(result).toEqual({
      ...orderMock,
      ...orderCustomerMock,
      items: mockData.items,
      updateCardUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}/update-card?user=${mockData.order.user}`,
      checkoutUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}`,
      receiptUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}/receipt?user=${mockData.order.user}`,
      loggedInCheckoutUrl: `${process.env.CHECKOUT_BASE_URL}profile/${mockData.order.orderId}`,
    })
  })
  it('Should get subscription type order with items correctly with backend url set', async () => {
    process.env.ORDER_BACKEND_URL = 'test.dev.hel'
    process.env.CHECKOUT_BASE_URL = 'https://checkout.dev.hel/'
    const mockData = {
      order: {
        ...orderMock,
        ...orderBackendCustomerMock,
        type: 'subscription',
        subscriptionId: '8f346802-b564-490f-b8af-ff8a7ea923db',
      },
      items: [
        {
          orderId: orderMock.orderId,
          orderItemId: '19699acf-b0a3-440f-818f-e582825fa3a7',
          productId: '30a245ed-5fca-4fcf-8b2a-cdf1ce6fca0d',
          quantity: 1,
          productName: 'Product Name',
          productLabel: 'Product Label',
          productDescription: 'Product Description',
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
      user: orderMock.user,
    })
    expect(result).toEqual({
      ...orderMock,
      ...orderCustomerMock,
      type: 'subscription',
      items: mockData.items,
      subscriptionId: mockData.order.subscriptionId,
      updateCardUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}/update-card?user=${mockData.order.user}`,
      checkoutUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}`,
      receiptUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}/receipt?user=${mockData.order.user}`,
      loggedInCheckoutUrl: `${process.env.CHECKOUT_BASE_URL}profile/${mockData.order.orderId}`,
    })
  })
})

describe('Test Calculate Totals for Order', () => {
  it('Should throw error with no backend url set', async () => {
    process.env.ORDER_BACKEND_URL = ''
    await expect(
      setOrderTotals({
        orderId: 'test',
        user: 'u1',
        priceNet: '0',
        priceVat: '0',
        priceTotal: '0',
      })
    ).rejects.toThrow('No order backend URL set')
  })
  it('Should set zero totals for order correctly with backend url set', async () => {
    process.env.ORDER_BACKEND_URL = 'test.dev.hel'
    process.env.CHECKOUT_BASE_URL = 'https://checkout.dev.hel/'
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
      user: mockData.order.user,
      priceNet: 0,
      priceVat: 0,
      priceTotal: 0,
    })
    expect(result).toEqual({
      ...orderMock,
      items: [],
      customer: undefined,
      status: 'draft',
      priceNet: '0',
      priceVat: '0',
      priceTotal: '0',
      updateCardUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}/update-card?user=${mockData.order.user}`,
      checkoutUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}`,
      receiptUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}/receipt?user=${mockData.order.user}`,
      loggedInCheckoutUrl: `${process.env.CHECKOUT_BASE_URL}profile/${mockData.order.orderId}`,
    })
  })
  it('Should set totals for order with items correctly with backend url set', async () => {
    process.env.ORDER_BACKEND_URL = 'test.dev.hel'
    process.env.CHECKOUT_BASE_URL = 'https://checkout.dev.hel/'
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
          productLabel: 'Product Label',
          productDescription: 'Product Description',
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
      user: orderMock.user,
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
      updateCardUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}/update-card?user=${mockData.order.user}`,
      checkoutUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}`,
      receiptUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}/receipt?user=${mockData.order.user}`,
      loggedInCheckoutUrl: `${process.env.CHECKOUT_BASE_URL}profile/${mockData.order.orderId}`,
    })
  })
})

describe('Test Create Accounting entry for order', () => {
  it('Should throw error with no backend url set', async () => {
    process.env.ORDER_BACKEND_URL = ''
    await expect(
      createAccountingEntryForOrder({ dtos: [], orderId: '' })
    ).rejects.toThrow('No order backend URL set')
  })
  it('Should create order accounting entry correctly with backend url set', async () => {
    process.env.ORDER_BACKEND_URL = 'test.dev.hel'
    process.env.CHECKOUT_BASE_URL = 'https://checkout.dev.hel/'
    const mockData = {
      orderId: orderMock.orderId,
      dtos: [
        {
          productId: '123',
          priceGross: '124',
          priceNet: '100',
          companyCode: 'companyCode',
          mainLedgerAccount: 'mainLedgerAccount',
          vatCode: 'vatCode',
          internalOrder: 'internalOrder',
          profitCenter: 'profitCenter',
          project: 'project',
          operationArea: 'operationArea',
        },
      ],
    }
    axiosMock.post.mockResolvedValue({ data: mockData })
    const result = await createAccountingEntryForOrder({
      ...mockData,
    })
    expect(result).toEqual(mockData)
  })
})
