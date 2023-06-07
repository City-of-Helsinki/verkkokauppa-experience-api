import axios from 'axios'
import { PaytrailOnlineRefundPaymentSuccessController } from './paytrailOnlineRefundPaymentSuccessController'
import type { PaytrailStatus } from '@verkkokauppa/payment-backend'
import type { Response } from 'express'

jest.mock('axios')

jest.mock('@verkkokauppa/payment-backend', () => {
  // grab all the *real* implementations of the module's functions
  // in an object
  const actual = jest.requireActual('@verkkokauppa/payment-backend')
  // return a new module implementation
  return {
    __esModules: true,
    // first start with all of the module's functions auto-mocked
    getPaidRefundPaymentAdmin: jest.fn(() => null),
    // lastly override w/ any of the module's functions that
    // we want to use the *real* implementations for

    // checkPaytrailRefundCallbackUrl not mocked so axios post mock gets called
    // with real implementation
    checkPaytrailRefundCallbackUrl: actual.checkPaytrailRefundCallbackUrl,
  }
})
const axiosMock = axios as jest.Mocked<typeof axios>

const orderBackendResponseMock = {
  order: {
    orderId: '145d8829-07b7-4b03-ab0e-24063958ab9b',
    namespace: 'test',
    user: 'test@test.dev.hel',
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

const refundBackendResponseMock = {
  refund: {
    refundId: 'f8487662-993f-45d9-90ed-d9618cf64dfa',
    orderId: '145d8829-07b7-4b03-ab0e-24063958ab9b',
    namespace: 'test',
    user: 'dummy_user',
    createdAt: '2022-11-24T11:14:26.440',
    status: 'draft',
    customerFirstName: 'dummy_firstname',
    customerLastName: 'dummy_lastname',
    customerEmail: 'f117c93e-426c-4dcc-8b86-f7ff65cacde4@ambientia.fi',
    customerPhone: '0404123456',
    refundReason: 'Palautuksen syy',
    priceNet: '100',
    priceVat: '100',
    priceTotal: '100',
  },
  items: [
    {
      refundItemId: '610df10c-85d6-4e94-8a4a-b1a2fd86ae3a',
      refundId: 'f8487662-993f-45d9-90ed-d9618cf64dfa',
      orderItemId: '19699acf-b0a3-440f-818f-e582825fa3a7',
      orderId: '145d8829-07b7-4b03-ab0e-24063958ab9b',
      productId: 'dummy-product',
      productName: 'Product Name',
      productLabel: 'productLabel',
      productDescription: 'productDescription',
      unit: 'pcs',
      quantity: 1,
      rowPriceNet: '100',
      rowPriceVat: '24',
      rowPriceTotal: '124',
      priceVat: '24',
      priceNet: '100',
      priceGross: '124',
      vatPercentage: '24',
      originalPriceNet: '100',
      originalPriceVat: '24',
      originalPriceGross: '124',
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
    } as PaytrailStatus

    axiosMock.get.mockImplementation((url, data?: any) => {
      if (url.includes(`/refund/paytrail/check-refund-callback-url`)) {
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
      if (url.includes(`/refund-admin/get-by-refund-id`)) {
        return Promise.resolve({ data: refundBackendResponseMock })
      }

      console.log(url)
      console.log(data)
      return Promise.resolve({})
    })

    const paytrailOnlineRefundPaymentSuccessController = new PaytrailOnlineRefundPaymentSuccessController()

    const refundId = refundBackendResponseMock.refund.refundId
    const mockRequest = {
      query: {
        'checkout-account': '375917',
        'checkout-algorithm': 'sha256',
        'checkout-amount': '124',
        'checkout-stamp': refundId + '_at_yyyyMMdd-HHmmss',
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

    await paytrailOnlineRefundPaymentSuccessController.execute(
      mockRequest as any,
      res
    )
    expect(res.redirect).toBeCalledTimes(1)
    expect(res.redirect).toHaveBeenCalledWith(
      302,
      'https://service.dev.hel/success?orderId=145d8829-07b7-4b03-ab0e-24063958ab9b'
    )
  })

  it('Check refund payment success controller redirects to failure url if paid refund payment is found to prevent multiple triggerings', async () => {
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
      if (url.includes(`/refund/paytrail/check-refund-callback-url`)) {
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
      if (url.includes(`/refund-admin/get-by-refund-id`)) {
        return Promise.resolve({ data: refundBackendResponseMock })
      }

      console.log(url)
      console.log(data)
      return Promise.resolve({})
    })
    const mockGetPaidRefundPaymentAdmin = jest.requireMock(
      '@verkkokauppa/payment-backend'
    ).getPaidRefundPaymentAdmin

    mockGetPaidRefundPaymentAdmin.mockImplementationOnce(() => {
      return {
        refundPayment: 'refundPayment',
      }
    })
    const paytrailOnlineRefundPaymentSuccessController = new PaytrailOnlineRefundPaymentSuccessController()

    const refundId = refundBackendResponseMock.refund.refundId
    const mockRequest = {
      query: {
        'checkout-account': '375917',
        'checkout-algorithm': 'sha256',
        'checkout-amount': '124',
        'checkout-stamp': refundId + '_at_yyyyMMdd-HHmmss',
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

    await paytrailOnlineRefundPaymentSuccessController.execute(
      mockRequest as any,
      res
    )
    expect(res.redirect).toBeCalledTimes(1)
    expect(res.redirect).toHaveBeenCalledWith(
      200,
      'https://test.dev.hel/failure'
    )
  })

  it('Check refund payment success controller redirects with failure redirect url when PaytrailStatus is not valid', async () => {
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
      if (url.includes(`/refund/paytrail/check-refund-callback-url`)) {
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
      if (url.includes(`/refund-admin/get-by-refund-id`)) {
        return Promise.resolve({ data: refundBackendResponseMock })
      }

      console.log(url)
      console.log(data)
      return Promise.resolve({})
    })

    const paytrailOnlineRefundPaymentSuccessController = new PaytrailOnlineRefundPaymentSuccessController()

    const refundId = refundBackendResponseMock.refund.refundId
    const mockRequest = {
      query: {
        'checkout-account': '375917',
        'checkout-algorithm': 'sha256',
        'checkout-amount': '124',
        'checkout-stamp': refundId + '_at_yyyyMMdd-HHmmss',
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

    await paytrailOnlineRefundPaymentSuccessController.execute(
      mockRequest as any,
      res
    )
    expect(res.redirect).toBeCalledTimes(1)
    expect(res.redirect).toHaveBeenCalledWith(
      302,
      'https://test.dev.hel/failure'
    )
  })

  it('Check refund payment success controller calls refund accounting creation', async () => {
    process.env.REDIRECT_PAYTRAIL_PAYMENT_URL_BASE = 'https://test.dev.hel'
    process.env.CONFIGURATION_BACKEND_URL = 'https://test.dev.hel'
    process.env.MESSAGE_BACKEND_URL = 'https://test.dev.hel'
    process.env.PAYMENT_BACKEND_URL = 'https://test.dev.hel/'
    process.env.MERCHANT_API_URL = 'https://test.dev.hel'
    process.env.ORDER_BACKEND_URL = 'https://test.dev.hel'
    process.env.PRODUCT_BACKEND_URL = 'https://test.dev.hel'

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

    const mockAccountingEntryForRefund = {
      refundId: 'refundId',
      orderId: 'orderId',
      createdAt: 'createdAt',
      items: [
        {
          orderId: '145d8829-07b7-4b03-ab0e-24063958ab9b',
          orderItemId: '19699acf-b0a3-440f-818f-e582825fa3a7',
          productId: 'dummy-product',
        },
      ],
    }

    const mockProductAccountingDtos = {
      balanceProfitCenter: 'balanceProfitCenter',
      companyCode: 'companyCode',
      internalOrder: 'internalOrder',
      mainLedgerAccount: 'mainLedgerAccount',
      operationArea: 'operationArea',
      orderId: '145d8829-07b7-4b03-ab0e-24063958ab9b',
      orderItemId: '19699acf-b0a3-440f-818f-e582825fa3a7',
      originalPriceGross: '124',
      originalPriceNet: '100',
      originalPriceVat: '24',
      priceGross: '124',
      priceNet: '100',
      priceVat: '24',
      productDescription: 'productDescription',
      productId: 'dummy-product',
      productLabel: 'productLabel',
      productName: 'Product Name',
      profitCenter: 'profitCenter',
      project: 'project',
      quantity: 1,
      refundId: 'f8487662-993f-45d9-90ed-d9618cf64dfa',
      refundItemId: '610df10c-85d6-4e94-8a4a-b1a2fd86ae3a',
      rowPriceNet: '100',
      rowPriceTotal: '124',
      rowPriceVat: '24',
      unit: 'pcs',
      vatCode: 'vatCode',
      vatPercentage: '24',
    }

    const mockProductAccounting = [
      {
        productId: 'dummy-product',
        vatCode: 'vatCode',
        internalOrder: 'internalOrder',
        profitCenter: 'profitCenter',
        balanceProfitCenter: 'balanceProfitCenter',
        project: 'project',
        operationArea: 'operationArea',
        companyCode: 'companyCode',
        mainLedgerAccount: 'mainLedgerAccount',
      },
    ]

    const mockProduct = { productId: 'dummy-product', name: 'Test' }

    const mockPaytrailStatus = {
      paymentPaid: true,
      valid: true,
    } as PaytrailStatus

    axiosMock.get.mockImplementation((url, data?: any) => {
      if (url.includes(`/refund/paytrail/check-refund-callback-url`)) {
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
      if (url.includes(`/refund-admin/get-by-refund-id`)) {
        return Promise.resolve({ data: refundBackendResponseMock })
      }
      if (url.includes(`/product/get`)) {
        return Promise.resolve({ data: mockProduct })
      }
      if (url.includes(`/product/accounting/list`)) {
        return Promise.resolve({ data: mockProductAccounting })
      }

      console.log(url)
      console.log(data)
      return Promise.resolve({})
    })

    axiosMock.post.mockImplementation((url, data?: any) => {
      if (url.includes(`/refund/accounting/create`)) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(data.productId).toEqual('dummy-product')
        return Promise.resolve({ data: mockAccountingEntryForRefund })
      }
      console.log(url)
      console.log(data)
      return Promise.resolve({})
    })

    const paytrailOnlineRefundPaymentSuccessController = new PaytrailOnlineRefundPaymentSuccessController()

    const refundId = refundBackendResponseMock.refund.refundId
    const mockRequest = {
      query: {
        'checkout-account': '375917',
        'checkout-algorithm': 'sha256',
        'checkout-amount': '124',
        'checkout-stamp': refundId + '_at_yyyyMMdd-HHmmss',
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

    await paytrailOnlineRefundPaymentSuccessController.execute(
      mockRequest as any,
      res
    )
    expect(res.redirect).toBeCalledTimes(1)
    expect(res.redirect).toHaveBeenCalledWith(
      302,
      'https://service.dev.hel/success?orderId=145d8829-07b7-4b03-ab0e-24063958ab9b'
    )

    expect(axios.post).toHaveBeenCalledWith(
      'https://test.dev.hel/refund/accounting/create',
      {
        refundId: refundId,
        orderId: mockProductAccountingDtos.orderId,
        dtos: [mockProductAccountingDtos],
      }
    )
  })
})
