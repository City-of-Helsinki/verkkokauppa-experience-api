import axios from 'axios'
import { PaytrailOnlinePaymentNotifyController } from './paytrailOnlinePaymentNotifyController'
import type { PaytrailStatus } from '@verkkokauppa/payment-backend'
import type { Response } from 'express'

jest.mock('axios')
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
}

describe('Test paytrail notify controller', () => {
  it('Check notify controller returns status 200 when paymentPaid = true', async () => {
    process.env.REDIRECT_PAYMENT_URL_BASE = 'https://test.dev.hel'
    process.env.CONFIGURATION_BACKEND_URL = 'https://test.dev.hel'
    process.env.MESSAGE_BACKEND_URL = 'https://test.dev.hel'
    process.env.PAYMENT_BACKEND_URL = 'https://test.dev.hel/'
    process.env.MERCHANT_API_URL = 'https://test.dev.hel'
    process.env.ORDER_BACKEND_URL = 'https://test.dev.hel'
    process.env.PRODUCT_BACKEND_URL = 'https://test.dev.hel'

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

    const mockPaytrailStatus = {
      paymentPaid: true,
    } as PaytrailStatus

    const mockAccountingEntryForOrder = {
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

    const mockProductAccounting = [
      {
        productId: 'dummy-product',
        vatCode: 'vatCode',
        internalOrder: 'internalOrder',
        profitCenter: 'profitCenter',
        project: 'project',
        operationArea: 'operationArea',
        companyCode: 'companyCode',
        mainLedgerAccount: 'mainLedgerAccount',
      },
    ]

    const mockProduct = { productId: 'dummy-product', name: 'Test' }

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
      if (url.includes(`/public/get`)) {
        return Promise.resolve({ data: configMock })
      }
      if (url.includes(`/payment/online/get`)) {
        return Promise.resolve({ data: paymentMock })
      }
      if (url.includes(`/order-admin/get`)) {
        return Promise.resolve({ data: orderBackendResponseMock })
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
      if (url.includes(`/order/accounting/create`)) {
        return Promise.resolve({ data: mockAccountingEntryForOrder })
      }
      console.log(url)
      console.log(data)
      return Promise.resolve({})
    })

    const paytrailOnlinePaymentNotifyController = new PaytrailOnlinePaymentNotifyController()

    const orderId = orderBackendResponseMock.order.orderId
    const mockRequest = {
      query: {
        'checkout-account': '375917',
        'checkout-algorithm': 'sha256',
        'checkout-amount': '2964',
        'checkout-stamp': orderId,
        'checkout-reference': '192387192837195',
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
    const mockGetFunction = jest.fn()

    mockGetFunction.mockImplementation((key) => {
      if (key.includes(`user`)) {
        return 'dummy-user'
      }
      if (key.includes(`content-length`)) {
        return 'content-length'
      }
      console.log(key)
      return 'mockGetFunction.mockImplementation'
    })
    res.get = mockGetFunction
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)

    await paytrailOnlinePaymentNotifyController.execute(mockRequest as any, res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      paymentPaid: true,
    })
  })

  it('Check notify controller returns status 200 when paymentPaid = false', async () => {
    process.env.REDIRECT_PAYMENT_URL_BASE = 'https://test.dev.hel'
    process.env.CONFIGURATION_BACKEND_URL = 'https://test.dev.hel'
    process.env.MESSAGE_BACKEND_URL = 'https://test.dev.hel'
    process.env.PAYMENT_BACKEND_URL = 'https://test.dev.hel/'
    process.env.MERCHANT_API_URL = 'https://test.dev.hel'
    process.env.ORDER_BACKEND_URL = 'https://test.dev.hel'
    process.env.PRODUCT_BACKEND_URL = 'https://test.dev.hel'

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

    const mockPaytrailStatus = {
      paymentPaid: true,
    } as PaytrailStatus

    const mockAccountingEntryForOrder = {
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

    const mockProductAccounting = [
      {
        productId: 'dummy-product',
        vatCode: 'vatCode',
        internalOrder: 'internalOrder',
        profitCenter: 'profitCenter',
        project: 'project',
        operationArea: 'operationArea',
        companyCode: 'companyCode',
        mainLedgerAccount: 'mainLedgerAccount',
      },
    ]

    const mockProduct = { productId: 'dummy-product', name: 'Test' }

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
      if (url.includes(`/public/get`)) {
        return Promise.resolve({ data: configMock })
      }
      if (url.includes(`/payment/online/get`)) {
        return Promise.resolve({ data: paymentMock })
      }
      if (url.includes(`/order-admin/get`)) {
        return Promise.resolve({ data: orderBackendResponseMock })
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
      if (url.includes(`/order/accounting/create`)) {
        return Promise.resolve({ data: mockAccountingEntryForOrder })
      }
      console.log(url)
      console.log(data)
      return Promise.resolve({})
    })

    const paytrailOnlinePaymentNotifyController = new PaytrailOnlinePaymentNotifyController()

    const orderId = orderBackendResponseMock.order.orderId
    const mockRequest = {
      query: {
        'checkout-account': '375917',
        'checkout-algorithm': 'sha256',
        'checkout-amount': '2964',
        'checkout-stamp': orderId,
        'checkout-reference': '192387192837195',
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
    const mockGetFunction = jest.fn()

    mockGetFunction.mockImplementation((key) => {
      if (key.includes(`user`)) {
        return 'dummy-user'
      }
      if (key.includes(`content-length`)) {
        return 'content-length'
      }
      console.log(key)
      return 'mockGetFunction.mockImplementation'
    })
    res.get = mockGetFunction
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)

    await paytrailOnlinePaymentNotifyController.execute(mockRequest as any, res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      paymentPaid: true,
    })
  })
})
