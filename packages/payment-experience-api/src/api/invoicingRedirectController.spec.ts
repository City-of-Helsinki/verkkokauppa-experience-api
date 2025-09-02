import axios from 'axios'
import type { PaytrailStatus } from '@verkkokauppa/payment-backend'
import type { Response } from 'express'
import { InvoicingRedirectController } from './invoicingRedirectController'

jest.mock('@verkkokauppa/message-backend')
const sendErrorNotificationMock = require('@verkkokauppa/message-backend').sendErrorNotification.mockImplementation(
  () => []
)
const sendOrderConfirmationEmailToCustomerMock = require('@verkkokauppa/message-backend').sendOrderConfirmationEmailToCustomer.mockImplementation(
  () => []
)

jest.mock('axios')
const axiosMock = axios as jest.Mocked<typeof axios>

const merchantId = 'merchantId'

const orderBackendResponseMock = {
  order: {
    orderId: '145d8829-07b7-4b03-ab0e-24063958ab9b',
    namespace: 'test',
    user: 'test@test.dev.hel',
    createdAt: '1619157868',
    type: 'order',
    incrementId: '1',
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
    invoice: {
      businessId: 'businessId',
      name: 'TMI Essi Esimerkki',
      address: 'Esimerkkiosoite 1',
      postcode: '123456',
      city: 'Esimerkkitoimipaikka',
    },
  },
  items: [
    {
      orderId: '145d8829-07b7-4b03-ab0e-24063958ab9b',
      merchantId: merchantId,
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
      invoicingDate: '2024-04-12',
    },
  ],
}

describe('Test invoicing redirect controller', () => {
  beforeEach(() => {
    sendErrorNotificationMock.mockClear()
    sendOrderConfirmationEmailToCustomerMock.mockClear()
  })

  it('Test invoicing entry creation', async () => {
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

    const merchantTermsOfServiceUrlConfigMock = {
      configurationId: '431eec7a-3b67-4c0f-8f6f-93522def1d75',
      namespace: 'test',
      configurationKey: 'merchantTermsOfServiceUrl',
      configurationValue: 'termsOfServiceUrl',
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
      canRetry: true,
      valid: true,
      authorized: true,
      paymentType: 'invoice',
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
        internalOrder: '',
        profitCenter: 'profitCenter',
        balanceProfitCenter: 'balanceProfitCenter',
        project: 'project',
        operationArea: 'operationArea',
        companyCode: 'companyCode',
        mainLedgerAccount: 'mainLedgerAccount',
      },
    ]

    const mockProductInvoicing = [
      {
        productId: 'dummy-product',
        salesOrg: 'salesOrg',
        salesOffice: 'salesOffice',
        material: 'material',
        orderType: 'orderType',
      },
    ]

    const mockProduct = { productId: 'dummy-product', name: 'Test' }

    axiosMock.get.mockImplementation((url, data?: any) => {
      if (url.includes(`/payment/invoice/check-return-url`)) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(data.params).toEqual({
          orderId: orderBackendResponseMock.order.orderId,
          merchantId: merchantId,
        })
        return Promise.resolve({
          data: mockPaytrailStatus,
        })
      }
      if (url.includes(`/public/getAll`)) {
        return Promise.resolve({
          data: [
            configMock,
            merchantConfigMock,
            merchantTermsOfServiceUrlConfigMock,
          ],
        })
      }
      if (url.includes(`/merchant/test`)) {
        return Promise.resolve({
          data: [
            configMock,
            merchantConfigMock,
            merchantTermsOfServiceUrlConfigMock,
          ],
        })
      }
      if (url.includes(`/public/get`)) {
        return Promise.resolve({ data: configMock })
      }
      if (url.includes(`/payment/online/get`)) {
        return Promise.resolve({ data: paymentMock })
      }
      if (url.includes(`/order/get`)) {
        return Promise.resolve({ data: orderBackendResponseMock })
      }
      if (url.includes(`/product/get`)) {
        return Promise.resolve({ data: mockProduct })
      }
      if (url.includes(`/product/accounting/list`)) {
        return Promise.resolve({ data: mockProductAccounting })
      }
      if (url.includes(`termsOfServiceUrl`)) {
        return Promise.resolve({ data: 'binary' })
      }

      console.log(url)
      console.log(data)
      return Promise.resolve({})
    })

    axiosMock.post.mockImplementation((url, data?: any) => {
      if (url.includes(`/order/invoicing/create`)) {
        return Promise.resolve({ data: mockAccountingEntryForOrder })
      }
      if (url.includes(`/product/invoicing/list`)) {
        return Promise.resolve({ data: mockProductInvoicing })
      }
      if (url.includes(`/order/setAccounted`)) {
        return Promise.resolve({})
      }
      if (url.includes(`/message/send/email`)) {
        return Promise.resolve({ data: 'email' })
      }

      console.log(url)
      console.log(data)
      return Promise.resolve({})
    })

    const invoicingRedirectController = new InvoicingRedirectController()

    const mockRequest = {
      query: {
        orderId: orderBackendResponseMock.order.orderId,
        user: orderBackendResponseMock.order.user,
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
    res.redirect = jest.fn()

    await invoicingRedirectController.execute(mockRequest as any, res)
    expect(res.redirect).toHaveBeenCalledWith(
      302,
      'https://service.dev.hel/success?orderId=145d8829-07b7-4b03-ab0e-24063958ab9b&user=test%40test.dev.hel'
    )
    expect(sendErrorNotificationMock).toHaveBeenCalledTimes(0)
    expect(sendOrderConfirmationEmailToCustomerMock).toHaveBeenCalledTimes(1)
  })

  it('Test invoicing entry creation with faulty invoicing data', async () => {
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

    const merchantTermsOfServiceUrlConfigMock = {
      configurationId: '431eec7a-3b67-4c0f-8f6f-93522def1d75',
      namespace: 'test',
      configurationKey: 'merchantTermsOfServiceUrl',
      configurationValue: 'termsOfServiceUrl',
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
      canRetry: true,
      valid: true,
      authorized: true,
      paymentType: 'invoice',
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

    const mockProductInvoicing = [
      {
        productId: 'dummy-product',
        salesOrg: 'salesOrg',
        salesOffice: 'salesOffice',
        material: 'material',
        orderType: 'orderType',
      },
    ]

    const mockProduct = { productId: 'dummy-product', name: 'Test' }

    let mockFaultyProductAccounting: object[] = [
      {
        productId: 'dummy-product',
        vatCode: 'vatCode',
        internalOrder: null,
        profitCenter: null,
        balanceProfitCenter: 'balanceProfitCenter',
        project: null,
        operationArea: 'operationArea',
        companyCode: 'companyCode',
        mainLedgerAccount: 'mainLedgerAccount',
      },
    ]

    axiosMock.get.mockImplementation((url, data?: any) => {
      if (url.includes(`/payment/invoice/check-return-url`)) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(data.params).toEqual({
          orderId: orderBackendResponseMock.order.orderId,
          merchantId: merchantId,
        })
        return Promise.resolve({
          data: mockPaytrailStatus,
        })
      }
      if (url.includes(`/public/getAll`)) {
        return Promise.resolve({
          data: [
            configMock,
            merchantConfigMock,
            merchantTermsOfServiceUrlConfigMock,
          ],
        })
      }
      if (url.includes(`/merchant/test`)) {
        return Promise.resolve({
          data: [
            configMock,
            merchantConfigMock,
            merchantTermsOfServiceUrlConfigMock,
          ],
        })
      }
      if (url.includes(`/public/get`)) {
        return Promise.resolve({ data: configMock })
      }
      if (url.includes(`/payment/online/get`)) {
        return Promise.resolve({ data: paymentMock })
      }
      if (url.includes(`/order/get`)) {
        return Promise.resolve({ data: orderBackendResponseMock })
      }
      if (url.includes(`/product/get`)) {
        return Promise.resolve({ data: mockProduct })
      }
      if (url.includes(`/product/accounting/list`)) {
        return Promise.resolve({ data: mockFaultyProductAccounting })
      }
      if (url.includes(`termsOfServiceUrl`)) {
        return Promise.resolve({ data: 'binary' })
      }

      console.log(url)
      console.log(data)
      return Promise.resolve({})
    })

    axiosMock.post.mockImplementation((url, data?: any) => {
      if (url.includes(`/order/invoicing/create`)) {
        return Promise.resolve({ data: mockAccountingEntryForOrder })
      }
      if (url.includes(`/product/invoicing/list`)) {
        return Promise.resolve({ data: mockProductInvoicing })
      }
      if (url.includes(`/order/setAccounted`)) {
        return Promise.resolve({})
      }
      if (url.includes(`/message/send/email`)) {
        return Promise.resolve({ data: 'email' })
      }

      console.log(url)
      console.log(data)
      return Promise.resolve({})
    })

    const invoicingRedirectController = new InvoicingRedirectController()

    const mockRequest = {
      query: {
        orderId: orderBackendResponseMock.order.orderId,
        user: orderBackendResponseMock.order.user,
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
    res.redirect = jest.fn()

    // test with internalOrder, profitCenter and project empty
    // should send error email notification but pass
    await invoicingRedirectController.execute(mockRequest as any, res)
    expect(res.redirect).toHaveBeenCalledWith(
      302,
      'https://service.dev.hel/success?orderId=145d8829-07b7-4b03-ab0e-24063958ab9b&user=test%40test.dev.hel'
    )
    expect(sendErrorNotificationMock).toHaveBeenCalledTimes(1)
    expect(sendErrorNotificationMock.mock.calls[0][0]).toEqual({
      cause:
        'ValidationError: Accounting information should only have internalOrder or profitCenter defined. If neither is given then project has to be defined.',
      header: 'Error - Creating invoicing entry for order failed',
      message:
        'Creating invoicing entry for order 145d8829-07b7-4b03-ab0e-24063958ab9b failed',
    })
    expect(sendOrderConfirmationEmailToCustomerMock).toHaveBeenCalledTimes(1)

    // test with internalOrder, profitCenter and project defined
    // should send error email notification but pass
    mockFaultyProductAccounting = [
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

    await invoicingRedirectController.execute(mockRequest as any, res)
    expect(res.redirect).toHaveBeenCalledWith(
      302,
      'https://service.dev.hel/success?orderId=145d8829-07b7-4b03-ab0e-24063958ab9b&user=test%40test.dev.hel'
    )
    expect(sendErrorNotificationMock).toHaveBeenCalledTimes(2)
    expect(sendErrorNotificationMock.mock.calls[1][0]).toEqual({
      cause:
        'ValidationError: Accounting information should only have internalOrder or profitCenter defined. If neither is given then project has to be defined.',
      header: 'Error - Creating invoicing entry for order failed',
      message:
        'Creating invoicing entry for order 145d8829-07b7-4b03-ab0e-24063958ab9b failed',
    })
    expect(sendOrderConfirmationEmailToCustomerMock).toHaveBeenCalledTimes(2)

    // finally proper data where only project is defined
    // should not send error email notification and should pass
    mockFaultyProductAccounting = [
      {
        productId: 'dummy-product',
        vatCode: 'vatCode',
        internalOrder: null,
        profitCenter: null,
        balanceProfitCenter: 'balanceProfitCenter',
        project: 'project',
        operationArea: 'operationArea',
        companyCode: 'companyCode',
        mainLedgerAccount: 'mainLedgerAccount',
      },
    ]

    await invoicingRedirectController.execute(mockRequest as any, res)
    expect(res.redirect).toHaveBeenCalledWith(
      302,
      'https://service.dev.hel/success?orderId=145d8829-07b7-4b03-ab0e-24063958ab9b&user=test%40test.dev.hel'
    )
    expect(sendErrorNotificationMock).toHaveBeenCalledTimes(2)
    expect(sendOrderConfirmationEmailToCustomerMock).toHaveBeenCalledTimes(3)
  })

  it('Test redirect to talpa success page', async () => {
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

    const merchantTermsOfServiceUrlConfigMock = {
      configurationId: '431eec7a-3b67-4c0f-8f6f-93522def1d75',
      namespace: 'test',
      configurationKey: 'merchantTermsOfServiceUrl',
      configurationValue: 'termsOfServiceUrl',
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
      canRetry: true,
      valid: true,
      authorized: true,
      paymentType: 'invoice',
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
        internalOrder: '',
        profitCenter: 'profitCenter',
        balanceProfitCenter: 'balanceProfitCenter',
        project: 'project',
        operationArea: 'operationArea',
        companyCode: 'companyCode',
        mainLedgerAccount: 'mainLedgerAccount',
      },
    ]

    const mockProductInvoicing = [
      {
        productId: 'dummy-product',
        salesOrg: 'salesOrg',
        salesOffice: 'salesOffice',
        material: 'material',
        orderType: 'orderType',
      },
    ]

    const mockProduct = { productId: 'dummy-product', name: 'Test' }

    axiosMock.get.mockImplementation((url, data?: any) => {
      if (url.includes(`/payment/invoice/check-return-url`)) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(data.params).toEqual({
          orderId: orderBackendResponseMock.order.orderId,
          merchantId: merchantId,
        })
        return Promise.resolve({
          data: mockPaytrailStatus,
        })
      }
      if (url.includes(`/public/getAll`)) {
        return Promise.resolve({
          data: [
            configMock,
            merchantConfigMock,
            merchantTermsOfServiceUrlConfigMock,
          ],
        })
      }
      if (url.includes(`/merchant/test`)) {
        return Promise.resolve({
          data: [
            configMock,
            merchantConfigMock,
            merchantTermsOfServiceUrlConfigMock,
          ],
        })
      }
      if (url.includes(`/public/get`)) {
        return Promise.resolve({})
      }
      if (url.includes(`/payment/online/get`)) {
        return Promise.resolve({ data: paymentMock })
      }
      if (url.includes(`/order/get`)) {
        return Promise.resolve({ data: orderBackendResponseMock })
      }
      if (url.includes(`/product/get`)) {
        return Promise.resolve({ data: mockProduct })
      }
      if (url.includes(`/product/accounting/list`)) {
        return Promise.resolve({ data: mockProductAccounting })
      }
      if (url.includes(`termsOfServiceUrl`)) {
        return Promise.resolve({ data: 'binary' })
      }

      console.log(url)
      console.log(data)
      return Promise.resolve({})
    })

    axiosMock.post.mockImplementation((url, data?: any) => {
      if (url.includes(`/order/invoicing/create`)) {
        return Promise.resolve({ data: mockAccountingEntryForOrder })
      }
      if (url.includes(`/product/invoicing/list`)) {
        return Promise.resolve({ data: mockProductInvoicing })
      }
      if (url.includes(`/order/setAccounted`)) {
        return Promise.resolve({})
      }
      if (url.includes(`/message/send/email`)) {
        return Promise.resolve({ data: 'email' })
      }

      console.log(url)
      console.log(data)
      return Promise.resolve({})
    })

    const invoicingRedirectController = new InvoicingRedirectController()

    const mockRequest = {
      query: {
        orderId: orderBackendResponseMock.order.orderId,
        user: orderBackendResponseMock.order.user,
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
    res.redirect = jest.fn()

    await invoicingRedirectController.execute(mockRequest as any, res)
    expect(res.redirect).toHaveBeenCalledWith(
      302,
      'https://test.dev.hel/145d8829-07b7-4b03-ab0e-24063958ab9b/success?user=test%40test.dev.hel'
    )
    expect(sendErrorNotificationMock).toHaveBeenCalledTimes(0)
    expect(sendOrderConfirmationEmailToCustomerMock).toHaveBeenCalledTimes(1)
  })

  it('Test redirect to failure page', async () => {
    process.env.REDIRECT_PAYMENT_URL_BASE = 'https://test.dev.hel'

    const invoicingRedirectController = new InvoicingRedirectController()

    const mockRequest = {
      query: {
        orderId: orderBackendResponseMock.order.orderId,
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
    res.redirect = jest.fn()

    await invoicingRedirectController.execute(mockRequest as any, res)
    expect(res.redirect).toHaveBeenCalledWith(
      302,
      'https://test.dev.hel/failure'
    )
    expect(sendErrorNotificationMock).toHaveBeenCalledTimes(0)
    expect(sendOrderConfirmationEmailToCustomerMock).toHaveBeenCalledTimes(0)
  })

  it('Test redirect to failure page when path already set', async () => {
    process.env.REDIRECT_PAYMENT_URL_BASE =
      'https://test.dev.hel/testipolku/success'

    const invoicingRedirectController = new InvoicingRedirectController()

    const mockRequest = {
      query: {
        orderId: orderBackendResponseMock.order.orderId,
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
    res.redirect = jest.fn()

    await invoicingRedirectController.execute(mockRequest as any, res)
    expect(res.redirect).toHaveBeenCalledWith(
      302,
      'https://test.dev.hel/testipolku/failure'
    )
    expect(sendErrorNotificationMock).toHaveBeenCalledTimes(0)
    expect(sendOrderConfirmationEmailToCustomerMock).toHaveBeenCalledTimes(0)
  })
})
