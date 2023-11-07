import axios from 'axios'
import type { PaytrailStatus } from '@verkkokauppa/payment-backend'
import type { Response } from 'express'
import { PaytrailOnlinePaymentReturnController } from './paytrailOnlinePaymentReturnController'

jest.mock('axios')

jest.mock('@verkkokauppa/payment-backend', () => {
  // grab all the *real* implementations of the module's functions
  // in an object
  const actual = jest.requireActual('@verkkokauppa/payment-backend')
  // return a new module implementation
  return {
    __esModules: true,
    // first start with all of the module's functions auto-mocked
    getPaidPaymentAdmin: jest.fn(() => null),
    getPaymentForOrder: jest.fn(() => null),
    sendReceiptToCustomer: jest.fn(() => null),
    // lastly override w/ any of the module's functions that
    // we want to use the *real* implementations for

    // checkPaytrailRefundCallbackUrl not mocked so axios post mock gets called
    // with real implementation
    checkPaytrailReturnUrl: actual.checkPaytrailReturnUrl,
    // Payment type has to be actual one
    PaymentType: actual.PaymentType,
  }
})

jest.mock('@verkkokauppa/message-backend', () => {
  // grab all the *real* implementations of the module's functions
  // in an object
  // const actual = jest.requireActual('@verkkokauppa/message-backend')
  // return a new module implementation
  return {
    __esModules: true,
    // first start with all of the module's functions auto-mocked
    sendOrderConfirmationEmailToCustomer: jest.fn(() => null),
    // lastly override w/ any of the module's functions that
    // we want to use the *real* implementations for

    // with real implementation
  }
})

const mockSendOrderConfirmationEmailToCustomer = jest.requireMock(
  '@verkkokauppa/message-backend'
).sendOrderConfirmationEmailToCustomer

const axiosMock = axios as jest.Mocked<typeof axios>

beforeEach(() => {
  jest.clearAllMocks()
})
const orderBackendResponseMock = {
  order: {
    orderId: '145d8829-07b7-4b03-ab0e-24063958ab9b',
    namespace: 'test',
    user: 'user123',
    createdAt: '1619157868',
    type: 'order',
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
  },
  items: [
    {
      orderId: '145d8829-07b7-4b03-ab0e-24063958ab9b',
      merchantId: 'merchantId',
      orderItemId: '19699acf-b0a3-440f-818f-e582825fa3a7',
      productId: 'dummy-product',
      productName: 'Product Name',
      productLabel: 'productLabel',
      productDescription: 'productDescription',
      quantity: 1,
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
}

describe('Test paytrail refund payment success controller', () => {
  it('Check refund payment success controller redirects with user success redirect url when PaytrailStatus is valid', async () => {
    process.env.REDIRECT_PAYTRAIL_PAYMENT_URL_BASE = 'https://test.dev.hel'
    process.env.CONFIGURATION_BACKEND_URL = 'https://test.dev.hel'
    process.env.MESSAGE_BACKEND_URL = 'https://test.dev.hel'
    process.env.PAYMENT_BACKEND_URL = 'https://test.dev.hel/'
    process.env.MERCHANT_API_URL = 'https://test.dev.hel'
    process.env.ORDER_BACKEND_URL = 'https://test.dev.hel'

    const configMock = {
      configurationId: '2f815a93-4c5c-442f-ba09-f294ecc12679',
      namespace: 'test',
      configurationKey: 'refundSuccessRedirectUrl',
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

    const mockPaytrailStatus = {
      paymentPaid: true,
      valid: true,
      paymentType: 'creditcards',
    } as PaytrailStatus

    axiosMock.get.mockImplementation((url, data?: any) => {
      if (url.includes(`/payment/paytrail/check-return-url`)) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(data.params).toEqual(mockRequest.query)
        return Promise.resolve({
          data: mockPaytrailStatus,
        })
      }
      if (url.includes(`/public/getAll`)) {
        return Promise.resolve({ data: [configMock, merchantConfigMock] })
      }
      if (url.includes(`/merchant/test`)) {
        return Promise.resolve({ data: [configMock, merchantConfigMock] })
      }
      if (url.includes(`/payment/online/get`)) {
        return Promise.resolve({ data: paymentMock })
      }
      if (url.includes(`/public/get`)) {
        return Promise.resolve({ data: configMock })
      }
      if (url.includes(`/order-admin/get`)) {
        return Promise.resolve({ data: orderBackendResponseMock })
      }

      console.log(url)
      console.log(data)
      return Promise.resolve({})
    })

    const paytrailOnlinePaymentReturnController = new PaytrailOnlinePaymentReturnController()

    const mockRequest = {
      query: {
        'checkout-account': '375917',
        'checkout-algorithm': 'sha256',
        'checkout-amount': '124',
        'checkout-stamp':
          orderBackendResponseMock.order.orderId + '_at_yyyyMMdd-HHmmss',
        'checkout-reference': '145d8829-07b7-4b03-ab0e-24063958ab9b',
        'checkout-transaction-id': '4b300af6-9a22-11e8-9184-abb6de7fd2d0',
        'checkout-status': 'ok',
        'checkout-provider': 'nordea',
        signature:
          'b2d3ecdda2c04563a4638fcade3d4e77dfdc58829b429ad2c2cb422d0fc64080',
        merchantId: 'merchantId',
      },
      httpVersion: 'HTTP/:1.1',
    } as any
    mockRequest.get = jest.fn()

    const res = ({} as unknown) as Response
    const mockGetFunction = jest.fn().mockImplementation((key) => {
      if (key.includes(`user`)) {
        return 'dummy-user'
      }
      if (key.includes(`content-length`)) {
        return 'content-length'
      }
      console.log(key)
      return 'mockGetFunction.mockImplementation'
    })
    const mockRedirect = jest
      .fn()
      .mockImplementation((status: number, url: string) => {
        return {
          status,
          url,
        }
      })
    res.get = mockGetFunction
    res.redirect = mockRedirect
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)

    await paytrailOnlinePaymentReturnController.execute(mockRequest as any, res)

    expect(mockSendOrderConfirmationEmailToCustomer).toBeCalledTimes(1)
    expect(res.redirect).toBeCalledTimes(1)
    expect(res.redirect).toHaveBeenCalledWith(
      302,
      `https://service.dev.hel/success?orderId=145d8829-07b7-4b03-ab0e-24063958ab9b&user=${orderBackendResponseMock.order.user}`
    )
  })

  it('Check payment success controller redirects to success url if paid payment is found to prevent multiple triggerings', async () => {
    process.env.REDIRECT_PAYTRAIL_PAYMENT_URL_BASE = 'https://test.dev.hel'
    process.env.CONFIGURATION_BACKEND_URL = 'https://test.dev.hel'
    process.env.MESSAGE_BACKEND_URL = 'https://test.dev.hel'
    process.env.PAYMENT_BACKEND_URL = 'https://test.dev.hel/'
    process.env.MERCHANT_API_URL = 'https://test.dev.hel'
    process.env.ORDER_BACKEND_URL = 'https://test.dev.hel'

    const configMock = {
      configurationId: '2f815a93-4c5c-442f-ba09-f294ecc12679',
      namespace: 'test',
      configurationKey: 'refundSuccessRedirectUrl',
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

    const mockPaytrailStatus = {
      paymentPaid: true,
      valid: true,
    } as PaytrailStatus

    axiosMock.get.mockImplementation((url, data?: any) => {
      if (url.includes(`/payment/paytrail/check-return-url`)) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(data.params).toEqual(mockRequest.query)
        return Promise.resolve({
          data: mockPaytrailStatus,
        })
      }
      if (url.includes(`/public/getAll`)) {
        return Promise.resolve({ data: [configMock, merchantConfigMock] })
      }
      if (url.includes(`/merchant/test`)) {
        return Promise.resolve({ data: [configMock, merchantConfigMock] })
      }
      if (url.includes(`/payment/online/get`)) {
        return Promise.resolve({ data: paymentMock })
      }
      if (url.includes(`/public/get`)) {
        return Promise.resolve({ data: configMock })
      }
      if (url.includes(`/order-admin/get`)) {
        return Promise.resolve({ data: orderBackendResponseMock })
      }

      console.log(url)
      console.log(data)
      return Promise.resolve({})
    })
    const mockGetPaidPaymentAdmin = jest.requireMock(
      '@verkkokauppa/payment-backend'
    ).getPaidPaymentAdmin

    mockGetPaidPaymentAdmin.mockImplementationOnce(() => {
      return {
        paymentId: 'dummy-payment',
        orderId: 'dummy-order',
        status: 'payment_paid_online',
      }
    })
    const paytrailOnlinePaymentReturnController = new PaytrailOnlinePaymentReturnController()

    const mockRequest = {
      query: {
        'checkout-account': '375917',
        'checkout-algorithm': 'sha256',
        'checkout-amount': '124',
        'checkout-stamp':
          orderBackendResponseMock.order.orderId + '_at_yyyyMMdd-HHmmss',
        'checkout-reference': '145d8829-07b7-4b03-ab0e-24063958ab9b',
        'checkout-transaction-id': '4b300af6-9a22-11e8-9184-abb6de7fd2d0',
        'checkout-status': 'ok',
        'checkout-provider': 'nordea',
        signature:
          'b2d3ecdda2c04563a4638fcade3d4e77dfdc58829b429ad2c2cb422d0fc64080',
        merchantId: 'merchantId',
      },
      httpVersion: 'HTTP/:1.1',
    } as any
    mockRequest.get = jest.fn()

    const res = ({} as unknown) as Response
    const mockGetFunction = jest.fn().mockImplementation((key) => {
      if (key.includes(`user`)) {
        return 'dummy-user'
      }
      if (key.includes(`content-length`)) {
        return 'content-length'
      }
      console.log(key)
      return 'mockGetFunction.mockImplementation'
    })
    const mockRedirect = jest
      .fn()
      .mockImplementation((status: number, url: string) => {
        return {
          status,
          url,
        }
      })
    res.get = mockGetFunction
    res.redirect = mockRedirect
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)

    await paytrailOnlinePaymentReturnController.execute(mockRequest as any, res)

    expect(mockSendOrderConfirmationEmailToCustomer).toBeCalledTimes(0)
    expect(res.redirect).toBeCalledTimes(1)
    expect(res.redirect).toHaveBeenCalledWith(
      302,
      'https://test.dev.hel/145d8829-07b7-4b03-ab0e-24063958ab9b/success?user=user123'
    )
  })

  it('Check payment success controller redirects to failure url if unpaid payment is found to prevent multiple triggerings', async () => {
    process.env.REDIRECT_PAYTRAIL_PAYMENT_URL_BASE = 'https://test.dev.hel'
    process.env.CONFIGURATION_BACKEND_URL = 'https://test.dev.hel'
    process.env.MESSAGE_BACKEND_URL = 'https://test.dev.hel'
    process.env.PAYMENT_BACKEND_URL = 'https://test.dev.hel/'
    process.env.MERCHANT_API_URL = 'https://test.dev.hel'
    process.env.ORDER_BACKEND_URL = 'https://test.dev.hel'

    const configMock = {
      configurationId: '2f815a93-4c5c-442f-ba09-f294ecc12679',
      namespace: 'test',
      configurationKey: 'refundSuccessRedirectUrl',
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

    const mockPaytrailStatus = {
      paymentPaid: true,
      valid: true,
    } as PaytrailStatus

    axiosMock.get.mockImplementation((url, data?: any) => {
      if (url.includes(`/payment/paytrail/check-return-url`)) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(data.params).toEqual(mockRequest.query)
        return Promise.resolve({
          data: mockPaytrailStatus,
        })
      }
      if (url.includes(`/public/getAll`)) {
        return Promise.resolve({ data: [configMock, merchantConfigMock] })
      }
      if (url.includes(`/merchant/test`)) {
        return Promise.resolve({ data: [configMock, merchantConfigMock] })
      }
      if (url.includes(`/payment/online/get`)) {
        return Promise.resolve({ data: paymentMock })
      }
      if (
        url.includes(`/public/get`) &&
        data.params['key'] !== 'orderPaymentFailedRedirectUrl'
      ) {
        return Promise.resolve({ data: configMock })
      }
      if (url.includes(`/order-admin/get`)) {
        return Promise.resolve({ data: orderBackendResponseMock })
      }

      console.log(url)
      console.log(data)
      return Promise.resolve({})
    })
    const mockGetPaidPaymentAdmin = jest.requireMock(
      '@verkkokauppa/payment-backend'
    ).getPaidPaymentAdmin

    mockGetPaidPaymentAdmin.mockImplementationOnce(() => {
      return {
        paymentId: 'dummy-payment',
        orderId: 'dummy-order',
        status: 'payment_cancelled',
      }
    })
    const paytrailOnlinePaymentReturnController = new PaytrailOnlinePaymentReturnController()

    const mockRequest = {
      query: {
        'checkout-account': '375917',
        'checkout-algorithm': 'sha256',
        'checkout-amount': '124',
        'checkout-stamp':
          orderBackendResponseMock.order.orderId + '_at_yyyyMMdd-HHmmss',
        'checkout-reference': '145d8829-07b7-4b03-ab0e-24063958ab9b',
        'checkout-transaction-id': '4b300af6-9a22-11e8-9184-abb6de7fd2d0',
        'checkout-status': 'ok',
        'checkout-provider': 'nordea',
        signature:
          'b2d3ecdda2c04563a4638fcade3d4e77dfdc58829b429ad2c2cb422d0fc64080',
        merchantId: 'merchantId',
      },
      httpVersion: 'HTTP/:1.1',
    } as any
    mockRequest.get = jest.fn()

    const res = ({} as unknown) as Response
    const mockGetFunction = jest.fn().mockImplementation((key) => {
      if (key.includes(`user`)) {
        return 'dummy-user'
      }
      if (key.includes(`content-length`)) {
        return 'content-length'
      }
      console.log(key)
      return 'mockGetFunction.mockImplementation'
    })
    const mockRedirect = jest
      .fn()
      .mockImplementation((status: number, url: string) => {
        return {
          status,
          url,
        }
      })
    res.get = mockGetFunction
    res.redirect = mockRedirect
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)

    await paytrailOnlinePaymentReturnController.execute(mockRequest as any, res)

    expect(mockSendOrderConfirmationEmailToCustomer).toBeCalledTimes(0)
    expect(res.redirect).toBeCalledTimes(1)
    expect(res.redirect).toHaveBeenCalledWith(
      302,
      'https://test.dev.hel/failure'
    )
  })

  it('Check payment success controller redirects with failure redirect url when PaytrailStatus is not valid', async () => {
    process.env.REDIRECT_PAYTRAIL_PAYMENT_URL_BASE = 'https://test.dev.hel'
    process.env.CONFIGURATION_BACKEND_URL = 'https://test.dev.hel'
    process.env.MESSAGE_BACKEND_URL = 'https://test.dev.hel'
    process.env.PAYMENT_BACKEND_URL = 'https://test.dev.hel/'
    process.env.MERCHANT_API_URL = 'https://test.dev.hel'
    process.env.ORDER_BACKEND_URL = 'https://test.dev.hel'

    const configMock = {
      configurationId: '2f815a93-4c5c-442f-ba09-f294ecc12679',
      namespace: 'test',
      configurationKey: 'refundSuccessRedirectUrl',
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
      namespace: 'test',
      orderId: '145d8829-07b7-4b03-ab0e-24063958ab9b',
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

    const mockPaytrailStatus = {
      paymentPaid: true,
      valid: false,
    } as PaytrailStatus

    axiosMock.get.mockImplementation((url, data?: any) => {
      if (url.includes(`/payment/paytrail/check-return-url`)) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(data.params).toEqual(mockRequest.query)
        return Promise.resolve({
          data: mockPaytrailStatus,
        })
      }
      if (url.includes(`/public/getAll`)) {
        return Promise.resolve({ data: [configMock, merchantConfigMock] })
      }
      if (url.includes(`/merchant/test`)) {
        return Promise.resolve({ data: [configMock, merchantConfigMock] })
      }
      if (url.includes(`/payment/online/get`)) {
        return Promise.resolve({ data: paymentMock })
      }
      if (
        url.includes(`/public/get`) &&
        data.params['key'] !== 'orderPaymentFailedRedirectUrl'
      ) {
        return Promise.resolve({ data: configMock })
      }
      if (url.includes(`/order-admin/get`)) {
        return Promise.resolve({ data: orderBackendResponseMock })
      }

      console.log(url)
      console.log(data)
      return Promise.resolve({})
    })

    const paytrailOnlinePaymentReturnController = new PaytrailOnlinePaymentReturnController()

    const mockRequest = {
      query: {
        'checkout-account': '375917',
        'checkout-algorithm': 'sha256',
        'checkout-amount': '124',
        'checkout-stamp':
          orderBackendResponseMock.order.orderId + '_at_yyyyMMdd-HHmmss',
        'checkout-reference': '145d8829-07b7-4b03-ab0e-24063958ab9b',
        'checkout-transaction-id': '4b300af6-9a22-11e8-9184-abb6de7fd2d0',
        'checkout-status': 'ok',
        'checkout-provider': 'nordea',
        signature:
          'b2d3ecdda2c04563a4638fcade3d4e77dfdc58829b429ad2c2cb422d0fc64080',
        merchantId: 'merchantId',
      },
      httpVersion: 'HTTP/:1.1',
    } as any
    mockRequest.get = jest.fn()

    const res = ({} as unknown) as Response
    const mockGetFunction = jest.fn().mockImplementation((key) => {
      if (key.includes(`user`)) {
        return 'dummy-user'
      }
      if (key.includes(`content-length`)) {
        return 'content-length'
      }
      console.log(key)
      return 'mockGetFunction.mockImplementation'
    })
    const mockRedirect = jest
      .fn()
      .mockImplementation((status: number, url: string) => {
        return {
          status,
          url,
        }
      })
    res.get = mockGetFunction
    res.redirect = mockRedirect
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)

    await paytrailOnlinePaymentReturnController.execute(mockRequest as any, res)

    expect(mockSendOrderConfirmationEmailToCustomer).toBeCalledTimes(0)
    expect(res.redirect).toBeCalledTimes(1)
    expect(res.redirect).toHaveBeenCalledWith(
      302,
      'https://test.dev.hel/failure'
    )
  })
})
