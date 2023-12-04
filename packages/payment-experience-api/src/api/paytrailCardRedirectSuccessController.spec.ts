/* eslint-disable */

import { PaytrailCardRedirectSuccessController } from './paytrailCardRedirectSuccessController'
import type { Request, Response } from 'express'
import axios from "axios"
import { PaymentType } from "@verkkokauppa/payment-backend"

jest.mock('@verkkokauppa/payment-backend')
jest.mock('@verkkokauppa/product-backend')
jest.mock('@verkkokauppa/configuration-backend')
jest.mock('@verkkokauppa/order-backend', () => {
 // grab all the *real* implementations of the module's functions
  // in an object
  const actual = jest.requireActual('@verkkokauppa/order-backend')
  // return a new module implementation
  return {
    __esModules: true,
    // first start with all of the module's functions auto-mocked
    getOrderAdmin: jest.fn(() => []),
    confirmOrder: jest.fn(() => []),
    // lastly override w/ any of the module's functions that
    // we want to use the *real* implementations for

    // createAccountingEntryForOrder not mocked so axios post mock gets called
    // with real implementation
    createAccountingEntryForOrder: actual.createAccountingEntryForOrder,
  }
})
jest.mock('axios')

const getOrderAdminMock = require('@verkkokauppa/order-backend').getOrderAdmin.mockImplementation(
  () => orderMock
)

const confirmOrderMock = require('@verkkokauppa/order-backend').confirmOrder.mockImplementation(
  () => orderMock
)

const getPublicServiceConfigurationMock = require('@verkkokauppa/configuration-backend').getPublicServiceConfiguration.mockImplementation(
  () => null
)

const checkPaytrailCardReturnUrlMock = require('@verkkokauppa/payment-backend').checkPaytrailCardReturnUrl.mockImplementation(
  () => paytrailstatus
)

require('@verkkokauppa/payment-backend').getPaymentForOrder.mockImplementation(
  () => payment
)

require('@verkkokauppa/configuration-backend').getMerchantDetailsForOrder.mockImplementation(
  () => merchant
)

const getProductAccountingBatchMock = require('@verkkokauppa/product-backend').getProductAccountingBatch.mockImplementation(
  () => mockProductAccounting
)

const axiosMock = axios as jest.Mocked<typeof axios>

const paytrailstatus = {
  status: 'payment_paid_online',
  paymentType:PaymentType.CREDIT_CARDS.toString(),
  paymentPaid: true
}

const merchant= {
  merchantName: 'merchantName',
  merchantStreet: 'merchantStreet',
  merchantZip: 'merchantZip',
  merchantCity: 'merchantCity',
  merchantEmail: 'merchantEmail',
  merchantPhone: 'merchantPhone',
  merchantUrl: 'merchantUrl',
  merchantBusinessId: 'merchantBusinessId',
  merchantTermsOfServiceUrl: 'merchantTermsOfServiceUrl',
}

const payment = {
  paymentId: 'f7a4fde4-1d3c-3f60-8bbe-7ed5977bb92b',
  timestamp: '20210901-051844',
  namespace: 'asukaspysakointi',
  orderId: 'e8bcb47c-ed17-3f4b-ad1d-079001d9d2a3',
  status: 'payment_created',
  paymentMethod: 'nordea',
  paymentMethodLabel: 'Nordea',
  paymentType: 'order',
  totalExclTax: 100,
  total: 124,
  taxAmount: 24,
  description: null,
  additionalInfo: '{"payment_method": nordea}',
  token:
    '427a38b2607b105de58c7dbda2d8ce2f6fcb31d6cc52f77b8818c0b5dcd503f5',
  paymentUrl:
    'https://www.vismapay.com/pbwapi/token/427a38b2607b105de58c7dbda2d8ce2f6fcb31d6cc52f77b8818c0b5dcd503f5',
}

const orderMock = {
  orderId: '145d8829-07b7-4b03-ab0e-24063958ab9b',
  createdAt: '2023-02-08T07:56:57.599811',
  namespace: 'ns1',
  user: 'user123',
  type: 'order',
  items: [
    {
      orderId: '145d8829-07b7-4b03-ab0e-24063958ab9b',
      orderItemId: '19699acf-b0a3-440f-818f-e582825fa3a7',
      productId: 'dummy-product',
      quantity: 1,
      productName: 'Product Name',
      productLabel: 'Product Label',
      productDescription: 'Product Description',
      unit: 'pcs',
      rowPriceNet: '100',
      rowPriceVat: '24',
      rowPriceTotal: '124',
      priceVat: '24',
      priceNet: '100',
      priceGross: '124',
      vatPercentage: '24',
      meta: [
        {
          orderItemMetaId: 'ec627fb7-d557-4b7b-9c1c-61434322c109',
          orderItemId: 'orderItemId1',
          orderId: '76a9121f-3bb7-33b2-8ca8-bc6a23db24c1',
          key: 'licencePlateNumber',
          value: 'XZY-123',
          label: 'Ajoneuvo',
          visibleInCheckout: 'true',
          ordinal: '0',
        },
        {
          orderItemMetaId: 'ec627fb7-d557-4b7b-9c1c-61434322c109',
          orderItemId: 'orderItemId2',
          orderId: '76a9121f-3bb7-33b2-8ca8-bc6a23db24c1',
          key: 'vehicle',
          value: 'Skoda Octavia',
          visibleInCheckout: 'true',
          ordinal: '1',
        },
      ],
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
  meta: [
    {
    orderItemMetaId: 'ec627fb7-d557-4b7b-9c1c-61434322c109',
    orderItemId: 'b513887b-db37-4249-a042-bf1425c340ac',
    orderId: '76a9121f-3bb7-33b2-8ca8-bc6a23db24c1',
    key: 'meta key ordinal 0',
    value: 'meta value ordinal 0',
    label: 'meta label ordinal 0',
    visibleInCheckout: 'true',
    ordinal: '0',
    }
    ],
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


const orderBackendCustomerMock = {
  customerFirstName: 'Customer',
  customerLastName: 'Name',
  customerEmail: 'test@test.dev.hel',
  customerPhone: '+358401231233',
};

const mockAxiosData = {
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
};

// mock axios post calls and check data they receive
function mockAxiosPostMailAndAccounting() {
  axiosMock.post.mockImplementation((url, data?: any) => {
    if (url.includes(`message/send/email`)) {
      expect(url).toEqual(
        `${process.env.MESSAGE_BACKEND_URL}/message/send/email`
      )
      expect(data.header).toEqual(
        'Tilausvahvistus ja kuitti / Order confirmation and receipt / Beställningsbekräftelse och kvitto'
      )
      expect(data.id).toEqual('145d8829-07b7-4b03-ab0e-24063958ab9b')
      expect(data.receiver).toEqual('essi.esimerkki@gmail.com')
      return Promise.resolve({ data: mockAxiosData })
    }

    if (url.includes(`order/accounting/create`)) {
      expect(url).toEqual(
        `${process.env.ORDER_BACKEND_URL}/order/accounting/create`
      )
      expect(data.orderId).toEqual(orderMock.orderId)
      return Promise.resolve({ data: mockProductAccounting })
    }

    return Promise.resolve({})
  })
}

function mockAxiosPostMailAndEmailNotification() {
  axiosMock.post.mockImplementation((url, data?: any) => {
    if (url.includes(`message/send/email`)) {
      expect(url).toEqual(
        `${process.env.MESSAGE_BACKEND_URL}/message/send/email`
      )
      expect(data.header).toEqual(
        'Tilausvahvistus ja kuitti / Order confirmation and receipt / Beställningsbekräftelse och kvitto'
      )
      expect(data.id).toEqual('145d8829-07b7-4b03-ab0e-24063958ab9b')
      expect(data.receiver).toEqual('essi.esimerkki@gmail.com')
      return Promise.resolve({ data: mockAxiosData })
    }
    else
    {
      expect(url).toEqual(
        `${process.env.MESSAGE_BACKEND_URL}/message/send/errorNotification`
      )
      return Promise.resolve({ })
    }
  })
}

const orderId = orderMock.orderId

const controller = new (class extends PaytrailCardRedirectSuccessController {
  implementation(req: Request, res: Response): Promise<any> {
    return super.implementation(req, res)
  }
})()

const mockRedirect = jest.fn()
const mockResponse = ({
  redirect: mockRedirect,
} as any) as Response

beforeEach(() => {
  jest.clearAllMocks()
})

describe('Test paytrailCardRedirectSuccessController', () => {
  const expectSummaryRedirect = (baseUrl?: string) => {
    expect(mockRedirect).toHaveBeenCalledTimes(1)
    expect(mockRedirect.mock.calls[0][0]).toEqual(302)
    expect(mockRedirect.mock.calls[0][1]).toEqual(
      `${baseUrl || 'https://test.dev.hel'}/${orderId}/summary?paymentPaid=false&user=${orderMock.user}`
    )
  }

  it('should throw for missing REDIRECT_PAYTRAIL_PAYMENT_URL_BASE', async () => {
    await expect(async () => {
      await controller.implementation({ params: { orderId }, query: { } } as any, mockResponse)
    }).rejects.toThrow('No default paytrail redirect url defined')
  })
  it('should redirect to summary if orderId is missing', async () => {
    process.env.REDIRECT_PAYTRAIL_PAYMENT_URL_BASE = 'https://test.dev.hel'
    await controller.implementation(
      { params: { }, query: { } } as any,
      mockResponse
    )
    expect(mockRedirect).toHaveBeenCalledTimes(1)
    expect(mockRedirect.mock.calls[0][0]).toEqual(302)
    expect(mockRedirect.mock.calls[0][1]).toEqual(
      `https://test.dev.hel/summary?paymentPaid=false`
    )
    expect(axiosMock.post).toHaveBeenCalledTimes(0)
  })
  it('should redirect to summary if order cannot be fetched', async () => {
    process.env.REDIRECT_PAYTRAIL_PAYMENT_URL_BASE = 'https://test.dev.hel'
    getOrderAdminMock.mockImplementationOnce(() => {
      throw new Error()
    })
    await controller.implementation(
      { params: { orderId }, query: { } } as any,
      mockResponse
    )
    expect(mockRedirect).toHaveBeenCalledTimes(1)
    expect(mockRedirect.mock.calls[0][0]).toEqual(302)
    expect(mockRedirect.mock.calls[0][1]).toEqual(
      `https://test.dev.hel/${orderId}/summary?paymentPaid=false`
    )
    expect(axiosMock.post).toHaveBeenCalledTimes(0)
  })
  it('should redirect to summary if getPublicServiceConfiguration fails', async () => {
    process.env.REDIRECT_PAYTRAIL_PAYMENT_URL_BASE = 'https://test.dev.hel'
    getPublicServiceConfigurationMock.mockImplementationOnce(() => {
      throw new Error()
    })
    await controller.implementation(
      { params: { orderId }, query: { } } as any,
      mockResponse
    )
    expectSummaryRedirect()
    expect(axiosMock.post).toHaveBeenCalledTimes(0)
  })
  it('should redirect to summary if checkPaytrailCardReturnUrl fails', async () => {
    process.env.REDIRECT_PAYTRAIL_PAYMENT_URL_BASE = 'https://test.dev.hel'
    checkPaytrailCardReturnUrlMock.mockImplementationOnce(() => {
      throw new Error()
    })
    await controller.implementation(
      { params: { orderId }, query: { } } as any,
      mockResponse
    )
    expectSummaryRedirect()
    expect(axiosMock.post).toHaveBeenCalledTimes(0)
  })
  it('should redirect to summary if payment status is not payment_paid_online', async () => {
    process.env.REDIRECT_PAYTRAIL_PAYMENT_URL_BASE = 'https://test.dev.hel'
    checkPaytrailCardReturnUrlMock.mockImplementationOnce(() => ({
      status: 'payment_paid'
    }))
    await controller.implementation(
      { params: { orderId }, query: { } } as any,
      mockResponse
    )
    expectSummaryRedirect()
  })
  it('should redirect to success', async () => {
    process.env.REDIRECT_PAYTRAIL_PAYMENT_URL_BASE = 'https://test.dev.hel'
    process.env.PRODUCT_BACKEND_URL = 'https://test.dev.hel'
    process.env.MESSAGE_BACKEND_URL = 'http://localhost:8181'
    process.env.ORDER_BACKEND_URL = 'http://localhost:8183'

    // mocks axios post and checks data sent to */message/send/email
    // and /order/accounting/create urls
    mockAxiosPostMailAndAccounting()

    axiosMock.get.mockImplementation((url) => {
      if (url.includes(`/product/accounting/list`)) {
        return Promise.resolve({ data: mockProductAccounting})
      }
      console.log(url)
      return Promise.resolve({})
    })

    confirmOrderMock.mockImplementationOnce(() => orderMock)

    await controller.implementation(
      { params: { orderId }, query: { } } as any,
      mockResponse
    )
    expect(mockRedirect).toHaveBeenCalledTimes(1)
    expect(axiosMock.post).toHaveBeenCalledTimes(2)
    expect(mockRedirect.mock.calls[0][0]).toEqual(302)
    expect(mockRedirect.mock.calls[0][1]).toEqual(
      `https://test.dev.hel/${orderId}/success?user=${orderMock.user}`
    )
  })
  it('should redirect to service specific success if service redirect url is present', async () => {
    process.env.REDIRECT_PAYTRAIL_PAYMENT_URL_BASE = 'https://test.dev.hel'
    process.env.PRODUCT_BACKEND_URL = 'https://test.dev.hel'
    process.env.MESSAGE_BACKEND_URL = 'http://localhost:8181'
    process.env.ORDER_BACKEND_URL = 'http://localhost:8183'
    const serviceUrl = 'https://testservice.dev.hel'

    // mocks axios post and checks data sent to */message/send/email
    // and /order/accounting/create urls
    mockAxiosPostMailAndAccounting()

    axiosMock.get.mockImplementation((url) => {
      if (url.includes(`/product/accounting/list`)) {
        return Promise.resolve({ data: mockProductAccounting})
      }
      console.log(url)
      return Promise.resolve({})
    })

    getPublicServiceConfigurationMock.mockImplementation(() => ({
      configurationValue: serviceUrl
    }))

    jest.autoMockOff()
    await controller.implementation(
      { params: { orderId }, query: { } } as any,
      mockResponse
    )
    jest.autoMockOn()
    expect(axiosMock.post).toHaveBeenCalledTimes(2)
    expect(mockRedirect).toHaveBeenCalledTimes(1)
    expect(mockRedirect.mock.calls[0][0]).toEqual(302)
    expect(mockRedirect.mock.calls[0][1]).toEqual(
      `${serviceUrl}/${orderId}/success?orderId=${orderId}&user=${orderMock.user}`
    )
  })
  it('should redirect to service specific failure url if present', async () => {
    process.env.REDIRECT_PAYTRAIL_PAYMENT_URL_BASE = 'https://test.dev.hel'
    const serviceUrl = 'https://testservice.dev.hel'
    getPublicServiceConfigurationMock.mockImplementationOnce(() => ({
      configurationValue: serviceUrl
    }))
    getPublicServiceConfigurationMock.mockImplementationOnce(() => ({
      configurationValue: serviceUrl
    }))
    checkPaytrailCardReturnUrlMock.mockImplementationOnce(() => ({
      status: 'not_paid'
    }))
    await controller.implementation(
      { params: { orderId }, query: { } } as any,
      mockResponse
    )
    expect(mockRedirect).toHaveBeenCalledTimes(1)
    expect(mockRedirect.mock.calls[0][0]).toEqual(302)
    expect(mockRedirect.mock.calls[0][1]).toEqual(
      `${serviceUrl}/?orderId=${orderId}&paymentPaid=false&user=${orderMock.user}`
    )
  })

  it('success even if product accounting is not received', async () => {
    process.env.REDIRECT_PAYTRAIL_PAYMENT_URL_BASE = 'https://test.dev.hel'
    process.env.MESSAGE_BACKEND_URL = 'http://localhost:8181'
    process.env.ORDER_BACKEND_URL = 'http://localhost:8183'
    getProductAccountingBatchMock.mockImplementationOnce(() => {})

    // mocks axios post and checks data sent to */message/send/email
    // and /order/accounting/create urls
    mockAxiosPostMailAndEmailNotification()

    axiosMock.get.mockImplementation((url) => {
      if (url.includes(`/product/accounting/list`)) {
        return Promise.resolve({ data: mockProductAccounting})
      }
      console.log(url)
      return Promise.resolve({})
    })

    getPublicServiceConfigurationMock.mockImplementation(() => ({
      configurationValue: ''
    }))

    await controller.implementation(
      { params: { orderId }, query: { } } as any,
      mockResponse
    )
    expect(mockRedirect).toHaveBeenCalledTimes(1)
    expect(axiosMock.post).toHaveBeenCalledTimes(2)
    expect(mockRedirect.mock.calls[0][0]).toEqual(302)
    expect(mockRedirect.mock.calls[0][1]).toEqual(
      `https://test.dev.hel/${orderId}/success?user=${orderMock.user}`
    )
  })

  it('success even if product accounting does not have product', async () => {
    process.env.REDIRECT_PAYTRAIL_PAYMENT_URL_BASE = 'https://test.dev.hel'
    process.env.MESSAGE_BACKEND_URL = 'http://localhost:8181'
    process.env.ORDER_BACKEND_URL = 'http://localhost:8183'
    getProductAccountingBatchMock.mockImplementationOnce(() => [
      {
        productId: 'dummy-product-fail',
        vatCode: 'vatCode',
        internalOrder: 'internalOrder',
        profitCenter: 'profitCenter',
        balanceProfitCenter: 'balanceProfitCenter',
        project: 'project',
        operationArea: 'operationArea',
        companyCode: 'companyCode',
        mainLedgerAccount: 'mainLedgerAccount',
      },
    ])

    // mocks axios post and checks data sent to */message/send/email
    // and /order/accounting/create urls
    mockAxiosPostMailAndEmailNotification()

    axiosMock.get.mockImplementation((url) => {
      if (url.includes(`/product/accounting/list`)) {
        return Promise.resolve({ data: mockProductAccounting})
      }
      console.log(url)
      return Promise.resolve({})
    })

    getPublicServiceConfigurationMock.mockImplementation(() => ({
      configurationValue: ''
    }))

    await controller.implementation(
      { params: { orderId }, query: { } } as any,
      mockResponse
    )
    expect(mockRedirect).toHaveBeenCalledTimes(1)
    expect(axiosMock.post).toHaveBeenCalledTimes(2)
    expect(mockRedirect.mock.calls[0][0]).toEqual(302)
    expect(mockRedirect.mock.calls[0][1]).toEqual(
      `https://test.dev.hel/${orderId}/success?user=${orderMock.user}`
    )
  })
})
