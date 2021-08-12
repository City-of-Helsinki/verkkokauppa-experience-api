import axios from 'axios'
import { createPaymentFromOrder } from './service'

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
      })
    ).rejects.toThrow('Unsupported payment method given as parameter')
  })
  it('Should throw error with incorrect payment method set', async () => {
    process.env.PAYMENT_BACKEND_URL = 'test.dev.hel'
    await expect(
      createPaymentFromOrder({
        language: '',
        order: orderMock,
        paymentMethod: 'asd',
      })
    ).rejects.toThrow('Unsupported payment method given as parameter')
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
    })
    expect(result).toEqual(mockData)
  })
})
