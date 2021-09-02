import axios from 'axios'
import {
  createPaymentFromOrder,
  getPaymentForOrder,
  getPaymentStatus,
  getPaymentUrl,
} from './service'

jest.mock('axios')
const axiosMock = axios as jest.Mocked<typeof axios>

const orderMock = {
  orderId: '145d8829-07b7-4b03-ab0e-24063958ab9b',
  namespace: 'testNameSpace',
  user: 'test@test.dev.hel',
  createdAt: '1619157868',
  type: 'order',
  items: [
    {
      orderId: '145d8829-07b7-4b03-ab0e-24063958ab9b',
      orderItemId: '19699acf-b0a3-440f-818f-e582825fa3a7',
      productId: '30a245ed-5fca-4fcf-8b2a-cdf1ce6fca0d',
      quantity: 2,
      productName: 'Product Name',
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

describe('Test Create Payment for Order', () => {
  it('Should throw error with no backend url set', async () => {
    process.env.PAYMENT_BACKEND_URL = ''
    await expect(
      createPaymentFromOrder({
        language: '',
        order: orderMock,
        paymentMethod: '',
        paymentMethodLabel: '',
      })
    ).rejects.toThrow('No payment API backend URL set')
  })
  it('Should throw error with no payment method set', async () => {
    process.env.PAYMENT_BACKEND_URL = 'test.dev.hel'
    await expect(
      createPaymentFromOrder({
        language: '',
        order: orderMock,
        paymentMethod: '',
        paymentMethodLabel: '',
      })
    ).rejects.toThrow()
  })
  it('Should throw error with incorrect payment method set', async () => {
    process.env.PAYMENT_BACKEND_URL = 'test.dev.hel'
    await expect(
      createPaymentFromOrder({
        language: '',
        order: orderMock,
        paymentMethod: 'asd',
        paymentMethodLabel: 'Asd',
      })
    ).rejects.toThrow()
  })
  it('Should create payment correctly', async () => {
    process.env.PAYMENT_BACKEND_URL = 'test.dev.hel'
    const mockData = {
      paymentId: '',
      namespace: '',
      orderId: '',
      status: '',
      paymentMethod: '',
      paymentType: '',
      totalExclTax: '',
      total: '',
      taxAmount: '',
      description: '',
      additionalInfo: '',
      token: '',
    }
    axiosMock.post.mockResolvedValue({ data: mockData })
    const result = await createPaymentFromOrder({
      language: 'fi',
      order: orderMock,
      paymentMethod: 'nordea',
      paymentMethodLabel: 'Nordea',
    })
    expect(result).toEqual(mockData)
  })
})

describe('Test Get Payment Url', () => {
  it('Should throw error with no backend url set', async () => {
    process.env.PAYMENT_BACKEND_URL = ''
    await expect(
      getPaymentUrl({
        namespace: '',
        orderId: '',
      })
    ).rejects.toThrow('No payment API backend URL set')
  })
  it('Should get payment url correctly', async () => {
    process.env.PAYMENT_BACKEND_URL = 'test.dev.hel'
    const paymentUrl = 'https://test.dev.hel/token/123'
    axiosMock.get.mockResolvedValue({ data: paymentUrl })
    const result = await getPaymentUrl({
      namespace: 'test',
      orderId: 'test',
    })
    expect(result).toEqual(paymentUrl)
  })
})
describe('Test Get Payment Status', () => {
  it('Should throw error with no backend url set', async () => {
    process.env.PAYMENT_BACKEND_URL = ''
    await expect(
      getPaymentStatus({
        namespace: '',
        orderId: '',
      })
    ).rejects.toThrow('No payment API backend URL set')
  })
  it('Should get payment status correctly', async () => {
    process.env.PAYMENT_BACKEND_URL = 'test.dev.hel'
    const status = 'PAID'
    axiosMock.get.mockResolvedValue({ data: status })
    const result = await getPaymentStatus({
      namespace: 'test',
      orderId: 'test',
    })
    expect(result).toEqual(status)
  })
})

describe('Test Get Payment for order', () => {
  it('Should throw error with no backend url set', async () => {
    process.env.PAYMENT_BACKEND_URL = ''
    await expect(
      getPaymentForOrder({
        orderId: '',
        namespace: '',
      })
    ).rejects.toThrow('No payment API backend URL set')
  })
  it('Should get payment for order correctly', async () => {
    process.env.PAYMENT_BACKEND_URL = 'test.dev.hel'
    const mockData = {
      paymentId: 'pid1',
      namespace: 'namespace1',
      orderId: 'oid1',
      status: 'paid',
      paymentMethod: 'cash',
      paymentType: 'type',
      totalExclTax: '100',
      total: '124',
      taxAmount: '24',
      description: '',
      additionalInfo: '',
      token: '12345678',
    }
    axiosMock.get.mockResolvedValue({ data: mockData })
    const result = await getPaymentForOrder({
      orderId: 'test',
      namespace: 'test',
    })
    expect(result).toEqual(mockData)
  })
})
