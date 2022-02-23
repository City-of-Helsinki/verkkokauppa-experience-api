import {
  createPaymentRedirectUrlFromVismaStatus,
  createUserRedirectUrl,
  parseOrderIdFromRedirect,
} from './vismaPay'
import axios from 'axios'
import { URL } from 'url'
import { PaymentType, VismaStatus } from '@verkkokauppa/payment-backend'

jest.mock('axios')
const axiosMock = axios as jest.Mocked<typeof axios>

const orderMock = {
  orderId: '145d8829-07b7-4b03-ab0e-24063958ab9b',
  namespace: 'test',
  user: 'test@test.dev.hel',
  createdAt: '1619157868',
  type: 'order',
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

describe('Test User redirection creation', () => {
  it('Should throw exception if no default redirect url specified', async () => {
    process.env.PAYMENT_BACKEND_URL = 'test.dev.hel'
    await expect(
      createUserRedirectUrl({
        order: orderMock,
        vismaStatus: {
          canRetry: false,
          paymentPaid: false,
          valid: true,
          paymentType: PaymentType.CREDIT_CARDS,
        },
      })
    ).rejects.toThrow('No default redirect url specified')
  })
  it('Should return checkout failure if order is not paid and no service specific configuration set', async () => {
    process.env.REDIRECT_PAYMENT_URL_BASE = 'https://test.dev.hel'
    const configMock = {
      configurationId: '2f815a93-4c5c-442f-ba09-f294ecc12679',
      namespace: 'test',
      configurationKey: 'ORDER_CREATED_REDIRECT_URL',
      configurationValue: '',
      restricted: false,
    }
    axiosMock.get.mockResolvedValue({ data: configMock })
    const result = await createUserRedirectUrl({
      order: orderMock,
      vismaStatus: {
        canRetry: false,
        paymentPaid: false,
        valid: true,
        paymentType: PaymentType.CREDIT_CARDS,
      },
    })
    expect(result.toString()).toBe(
      `${process.env.REDIRECT_PAYMENT_URL_BASE}/145d8829-07b7-4b03-ab0e-24063958ab9b/failure`
    )
  })
  it('Should return service failure if order is not paid and cannot be retried and with service specific configuration set', async () => {
    process.env.REDIRECT_PAYMENT_URL_BASE = 'https://test.dev.hel'
    process.env.CONFIGURATION_BACKEND_URL = 'https://test.dev.hel'
    const configMock = {
      configurationId: '2f815a93-4c5c-442f-ba09-f294ecc12679',
      namespace: 'test',
      configurationKey: 'ORDER_CREATED_REDIRECT_URL',
      configurationValue: 'https://service.dev.hel',
      restricted: false,
    }
    axiosMock.get.mockResolvedValue({ data: configMock })
    const result = await createUserRedirectUrl({
      order: orderMock,
      vismaStatus: {
        canRetry: false,
        paymentPaid: false,
        valid: true,
        paymentType: PaymentType.CREDIT_CARDS,
      },
    })
    expect(result.toString()).toBe(
      `https://service.dev.hel/failure?orderId=145d8829-07b7-4b03-ab0e-24063958ab9b`
    )
  })
  it('Should return checkout failure with retry if order is not paid and no service specific configuration set', async () => {
    process.env.REDIRECT_PAYMENT_URL_BASE = 'https://test.dev.hel'
    const configMock = {
      configurationId: '2f815a93-4c5c-442f-ba09-f294ecc12679',
      namespace: 'test',
      configurationKey: 'ORDER_CREATED_REDIRECT_URL',
      configurationValue: '',
      restricted: false,
    }
    axiosMock.get.mockResolvedValue({ data: configMock })
    const result = await createUserRedirectUrl({
      order: orderMock,
      vismaStatus: {
        canRetry: true,
        paymentPaid: false,
        valid: true,
        paymentType: PaymentType.CREDIT_CARDS,
      },
    })
    expect(result.toString()).toBe(
      `${process.env.REDIRECT_PAYMENT_URL_BASE}/145d8829-07b7-4b03-ab0e-24063958ab9b/summary?paymentPaid=false`
    )
  })
  it('Should return checkout failure with retry if order is not paid and with service specific configuration set', async () => {
    process.env.REDIRECT_PAYMENT_URL_BASE = 'https://test.dev.hel'
    process.env.CONFIGURATION_BACKEND_URL = 'https://test.dev.hel'
    const configMock = {
      configurationId: '2f815a93-4c5c-442f-ba09-f294ecc12679',
      namespace: 'test',
      configurationKey: 'ORDER_CREATED_REDIRECT_URL',
      configurationValue: 'https://service.dev.hel',
      restricted: false,
    }
    axiosMock.get.mockResolvedValue({ data: configMock })
    const result = await createUserRedirectUrl({
      order: orderMock,
      vismaStatus: {
        canRetry: true,
        paymentPaid: false,
        valid: true,
        paymentType: PaymentType.CREDIT_CARDS,
      },
    })
    expect(result.toString()).toBe(
      `${process.env.REDIRECT_PAYMENT_URL_BASE}/145d8829-07b7-4b03-ab0e-24063958ab9b/summary?paymentPaid=false`
    )
  })
  it('Should return checkout success if order is paid and no service specific configuration set', async () => {
    process.env.REDIRECT_PAYMENT_URL_BASE = 'https://test.dev.hel'
    const configMock = {
      configurationId: '2f815a93-4c5c-442f-ba09-f294ecc12679',
      namespace: 'test',
      configurationKey: 'ORDER_CREATED_REDIRECT_URL',
      configurationValue: '',
      restricted: false,
    }
    axiosMock.get.mockResolvedValue({ data: configMock })
    const result = await createUserRedirectUrl({
      order: orderMock,
      vismaStatus: {
        canRetry: false,
        paymentPaid: true,
        valid: true,
        paymentType: PaymentType.CREDIT_CARDS,
      },
    })
    expect(result.toString()).toBe(
      `${process.env.REDIRECT_PAYMENT_URL_BASE}/145d8829-07b7-4b03-ab0e-24063958ab9b/success`
    )
  })

  it('Should return service success if order is paid and with service specific configuration set', async () => {
    process.env.REDIRECT_PAYMENT_URL_BASE = 'https://test.dev.hel'
    process.env.CONFIGURATION_BACKEND_URL = 'https://test.dev.hel'
    process.env.MESSAGE_BACKEND_URL = 'https://test.dev.hel'
    process.env.PAYMENT_BACKEND_URL = 'https://test.dev.hel'

    const configMock = {
      configurationId: '2f815a93-4c5c-442f-ba09-f294ecc12679',
      namespace: 'test',
      configurationKey: 'ORDER_CREATED_REDIRECT_URL',
      configurationValue: 'https://service.dev.hel',
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
      if (url.includes(`/public/get`)) {
        return Promise.resolve({ data: configMock })
      }
      if (url.includes(`/payment/online/get`)) {
        return Promise.resolve({ data: paymentMock })
      }
      return Promise.resolve({})
    })

    axiosMock.post.mockImplementation((url) => {
      if (url.includes(`message/send/email`)) {
        return Promise.resolve({ data: messageMock })
      }
      return Promise.resolve({})
    })

    const result = await createUserRedirectUrl({
      order: orderMock,
      vismaStatus: {
        canRetry: false,
        paymentPaid: true,
        valid: true,
        paymentType: PaymentType.CREDIT_CARDS,
      },
    })
    expect(result.toString()).toBe(
      `${configMock.configurationValue}/success?orderId=145d8829-07b7-4b03-ab0e-24063958ab9b`
    )
  })

  it('Should return general error url if return url is not valid', async () => {
    process.env.REDIRECT_PAYMENT_URL_BASE = 'https://test.dev.hel'
    process.env.CONFIGURATION_BACKEND_URL = 'https://test.dev.hel'
    const configMock = {
      configurationId: '2f815a93-4c5c-442f-ba09-f294ecc12679',
      namespace: 'test',
      configurationKey: 'ORDER_CREATED_REDIRECT_URL',
      configurationValue: 'https://service.dev.hel',
      restricted: false,
    }
    axiosMock.get.mockResolvedValue({ data: configMock })
    const result = await createUserRedirectUrl({
      order: orderMock,
      vismaStatus: {
        canRetry: false,
        paymentPaid: true,
        valid: false,
        paymentType: PaymentType.CREDIT_CARDS,
      },
    })
    expect(result.toString()).toBe(
      `${process.env.REDIRECT_PAYMENT_URL_BASE}/failure`
    )
  })

  it('Redirect url creation function test', async () => {
    process.env.REDIRECT_PAYMENT_URL_BASE = 'https://test.dev.hel'
    process.env.CONFIGURATION_BACKEND_URL = 'https://test.dev.hel'
    process.env.MESSAGE_BACKEND_URL = 'https://test.dev.hel'
    process.env.PAYMENT_BACKEND_URL = 'https://test.dev.hel'

    const configMock = {
      configurationId: '2f815a93-4c5c-442f-ba09-f294ecc12679',
      namespace: 'test',
      configurationKey: 'ORDER_CREATED_REDIRECT_URL',
      configurationValue: 'https://service.dev.hel',
      restricted: false,
    }

    let mockVismaStatus = {
      paymentPaid: true,
      canRetry: false,
      valid: true,
      authorized: true,
      paymentType: 'string',
    } as VismaStatus
    const mockRedirectUrl = new URL(configMock.configurationValue)
    const createdUrl = createPaymentRedirectUrlFromVismaStatus(
      mockVismaStatus,
      orderMock,
      mockRedirectUrl,
      true
    )
    expect(createdUrl.pathname).toBe(`/${orderMock.orderId}/success`)

    mockVismaStatus.paymentPaid = false
    const createdUrl2 = createPaymentRedirectUrlFromVismaStatus(
      mockVismaStatus,
      orderMock,
      mockRedirectUrl,
      true
    )
    expect(createdUrl2.pathname).toBe(`/${orderMock.orderId}/failure`)

    mockVismaStatus.paymentPaid = false
    mockVismaStatus.authorized = false
    mockVismaStatus.paymentType = PaymentType.CARD_RENEWAL.toString()
    const createdUrl3 = createPaymentRedirectUrlFromVismaStatus(
      mockVismaStatus,
      orderMock,
      mockRedirectUrl,
      true
    )
    expect(createdUrl3.pathname).toBe(
      `/${orderMock.orderId}/card-update-failed`
    )
  })
})

describe('Test parse orderId from redirect', () => {
  it('Should return correct orderId from redirectUrl', () => {
    const query = {
      ORDER_NUMBER: 'f9ab55be-dbfe-3b39-bb38-60306d6958f3_at_20210824-0635',
    }

    expect(parseOrderIdFromRedirect({ query })).toBe(
      'f9ab55be-dbfe-3b39-bb38-60306d6958f3'
    )
  })
})
