import axios from 'axios'
import { sendReceipt } from '../lib/sendEmail'

jest.mock('axios')
const axiosMock = axios as jest.Mocked<typeof axios>

const orderMock = {
  orderId: '145d8829-07b7-4b03-ab0e-24063958ab9b',
  namespace: 'test',
  user: 'test@test.dev.hel',
  createdAt: '1619157868',
  type: 'order' as const,
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
      priceVat: '24',
      priceNet: '100',
      priceGross: '124',
      vatPercentage: '24',
    },
  ],
  merchant: {
    merchantName: 'merchantName',
    merchantStreet: 'merchantStreet',
    merchantZip: 'merchantZip',
    merchantCity: 'merchantCity',
    merchantEmail: 'merchantEmail',
    merchantPhone: 'merchantPhone',
    merchantUrl: 'merchantUrl',
    merchantBusinessId: 'merchantBusinessId',
  },
  customer: {
    firstName: 'Essi',
    lastName: 'esimerkki',
    email: 'essi.esimerkki@gmail.com',
    phone: '+358123456789',
    address: 'Esimerkkiosoite 1',
    district: '123456 Esimerkkitoimipaikka',
  },
}

describe('Test receipt send', () => {
  it('Receipt email send returns no errors', async () => {
    process.env.REDIRECT_PAYMENT_URL_BASE = 'https://test.dev.hel'
    process.env.CONFIGURATION_BACKEND_URL = 'https://test.dev.hel'
    process.env.MESSAGE_BACKEND_URL = 'https://test.dev.hel'
    process.env.PAYMENT_BACKEND_URL = 'https://test.dev.hel'
    process.env.MERCHANT_API_URL = 'https://test.dev.hel'

    const configMock = {
      configurationId: '2f815a93-4c5c-442f-ba09-f294ecc12679',
      namespace: 'test',
      configurationKey: 'ORDER_CREATED_REDIRECT_URL',
      configurationValue: 'https://service.dev.hel',
      restricted: false,
    }

    const merchantConfigMock = {
      configurationId: '431eec7a-3b67-4c0f-8f6f-93522def1d74',
      namespace: 'test',
      configurationKey: 'MERCHANT_NAME',
      configurationValue: 'nimi',
      restricted: false,
    }

    const paymentMock = {
      paymentId: 'dummy-payment',
      namespace: 'asukaspysakointi',
      orderId: 'dummy-order',
      status: 'payment_created',
      paymentMethod: 'nordea',
      paymentType: 'order',
      totalExclTax: 200,
      total: 248,
      taxAmount: 48,
      description: null,
      additionalInfo: '{"payment_method": nordea}',
      token: '427a38b2607b105de58c7dbda2d8ce2f6fcb31d6cc52f77b8818c0b5dcd503f5',
      paymentMethodLabel: 'paymentMethodLabel',
    }

    const messageMock = {
      template: 'template',
      error: '',
    }

    axiosMock.get.mockImplementation((url) => {
      if (url === undefined) {
        return Promise.resolve({ data: '' })
      }
      if (url.includes(`/public/getAll`)) {
        return Promise.resolve({ data: [configMock, merchantConfigMock] })
      }
      if (url.includes(`/merchant/test`)) {
        return Promise.resolve({ data: [configMock, merchantConfigMock] })
      }
      if (url.includes(`/public/get`)) {
        return Promise.resolve({ data: configMock })
      }
      if (url.includes(`/payment/online/get`)) {
        return Promise.resolve({ data: paymentMock })
      }
      console.log(url)
      return Promise.resolve({})
    })

    axiosMock.post.mockImplementation((url, data?: any) => {
      expect(data.header).toEqual(
        'Tilausvahvistus ja kuitti / Order confirmation and receipt / Beställningsbekräftelse och kvitto'
      )
      expect(data.id).toEqual('145d8829-07b7-4b03-ab0e-24063958ab9b')
      expect(data.receiver).toEqual('essi.esimerkki@gmail.com')
      if (url.includes(`message/send/email`)) {
        return Promise.resolve({ data: messageMock })
      }
      return Promise.resolve({})
    })

    const result = await sendReceipt(orderMock, false)
    expect(result.error).toBe(``)
    expect(result.template).toBe('template')
  })
})
