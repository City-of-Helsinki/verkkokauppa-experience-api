import { createUserRedirectUrl } from './vismaPay'
import axios from 'axios'

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
    },
  ],
}

describe('Test User redirection creation', () => {
  it('Should return failure if no default redirect url specified', async () => {
    process.env.PAYMENT_BACKEND_URL = 'test.dev.hel'
    await expect(
      createUserRedirectUrl({
        order: orderMock,
        vismaStatus: { canRetry: false, isPaymentPaid: false },
      })
    ).rejects.toThrow('No default redirect url specified')
  })
  it('Should return checkout failure if order is not paid and no service specific configuration set', async () => {
    process.env.REDIRECT_PAYMENT_URL_BASE = 'https://test.dev.hel'
    const configMock = {
      configurationId: '2f815a93-4c5c-442f-ba09-f294ecc12679',
      namespace: 'test',
      configurationKey: 'PAYMENT_RETURN_URL',
      configurationValue: '',
      restricted: false,
    }
    axiosMock.get.mockResolvedValue({ data: configMock })
    const result = await createUserRedirectUrl({
      order: orderMock,
      vismaStatus: { canRetry: false, isPaymentPaid: false },
    })
    expect(result.toString()).toBe(
      `${process.env.REDIRECT_PAYMENT_URL_BASE}/145d8829-07b7-4b03-ab0e-24063958ab9b/failure?retry=false`
    )
  })
  it('Should return service failure if order is not paid and with service specific configuration set', async () => {
    process.env.REDIRECT_PAYMENT_URL_BASE = 'https://test.dev.hel'
    process.env.CONFIGURATION_BACKEND_URL = 'https://test.dev.hel'
    const configMock = {
      configurationId: '2f815a93-4c5c-442f-ba09-f294ecc12679',
      namespace: 'test',
      configurationKey: 'PAYMENT_RETURN_URL',
      configurationValue: 'https://service.dev.hel',
      restricted: false,
    }
    axiosMock.get.mockResolvedValue({ data: configMock })
    const result = await createUserRedirectUrl({
      order: orderMock,
      vismaStatus: { canRetry: false, isPaymentPaid: false },
    })
    expect(result.toString()).toBe(
      `${configMock.configurationValue}/145d8829-07b7-4b03-ab0e-24063958ab9b/failure?retry=false`
    )
  })
  it('Should return checkout failure with retry if order is not paid and no service specific configuration set', async () => {
    process.env.REDIRECT_PAYMENT_URL_BASE = 'https://test.dev.hel'
    const configMock = {
      configurationId: '2f815a93-4c5c-442f-ba09-f294ecc12679',
      namespace: 'test',
      configurationKey: 'PAYMENT_RETURN_URL',
      configurationValue: '',
      restricted: false,
    }
    axiosMock.get.mockResolvedValue({ data: configMock })
    const result = await createUserRedirectUrl({
      order: orderMock,
      vismaStatus: { canRetry: true, isPaymentPaid: false },
    })
    expect(result.toString()).toBe(
      `${process.env.REDIRECT_PAYMENT_URL_BASE}/145d8829-07b7-4b03-ab0e-24063958ab9b/failure?retry=true`
    )
  })
  it('Should return service failure with retry if order is not paid and with service specific configuration set', async () => {
    process.env.REDIRECT_PAYMENT_URL_BASE = 'https://test.dev.hel'
    process.env.CONFIGURATION_BACKEND_URL = 'https://test.dev.hel'
    const configMock = {
      configurationId: '2f815a93-4c5c-442f-ba09-f294ecc12679',
      namespace: 'test',
      configurationKey: 'PAYMENT_RETURN_URL',
      configurationValue: 'https://service.dev.hel',
      restricted: false,
    }
    axiosMock.get.mockResolvedValue({ data: configMock })
    const result = await createUserRedirectUrl({
      order: orderMock,
      vismaStatus: { canRetry: true, isPaymentPaid: false },
    })
    expect(result.toString()).toBe(
      `${configMock.configurationValue}/145d8829-07b7-4b03-ab0e-24063958ab9b/failure?retry=true`
    )
  })
  it('Should return checkout success if order is paid and no service specific configuration set', async () => {
    process.env.REDIRECT_PAYMENT_URL_BASE = 'https://test.dev.hel'
    const configMock = {
      configurationId: '2f815a93-4c5c-442f-ba09-f294ecc12679',
      namespace: 'test',
      configurationKey: 'PAYMENT_RETURN_URL',
      configurationValue: '',
      restricted: false,
    }
    axiosMock.get.mockResolvedValue({ data: configMock })
    const result = await createUserRedirectUrl({
      order: orderMock,
      vismaStatus: { canRetry: false, isPaymentPaid: true },
    })
    expect(result.toString()).toBe(
      `${process.env.REDIRECT_PAYMENT_URL_BASE}/145d8829-07b7-4b03-ab0e-24063958ab9b/success`
    )
  })
  it('Should return service success if order is paid and with service specific configuration set', async () => {
    process.env.REDIRECT_PAYMENT_URL_BASE = 'https://test.dev.hel'
    process.env.CONFIGURATION_BACKEND_URL = 'https://test.dev.hel'
    const configMock = {
      configurationId: '2f815a93-4c5c-442f-ba09-f294ecc12679',
      namespace: 'test',
      configurationKey: 'PAYMENT_RETURN_URL',
      configurationValue: 'https://service.dev.hel',
      restricted: false,
    }
    axiosMock.get.mockResolvedValue({ data: configMock })
    const result = await createUserRedirectUrl({
      order: orderMock,
      vismaStatus: { canRetry: false, isPaymentPaid: true },
    })
    expect(result.toString()).toBe(
      `${configMock.configurationValue}/145d8829-07b7-4b03-ab0e-24063958ab9b/success`
    )
  })
})