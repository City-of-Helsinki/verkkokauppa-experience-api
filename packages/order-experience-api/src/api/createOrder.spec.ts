import type { Response } from 'express'
import type { ValidatedRequest } from '@verkkokauppa/core'
import { CreateController } from './createController'
import { ReferenceType } from '@verkkokauppa/payment-backend'

jest.mock('@verkkokauppa/order-backend')
jest.mock('@verkkokauppa/payment-backend')
jest.mock('@verkkokauppa/product-mapping-backend')

const createOrderMock = require('@verkkokauppa/order-backend').createOrder.mockImplementation(
  () => ({})
)

const createOrderWithItemsMock = require('@verkkokauppa/order-backend').createOrderWithItems.mockImplementation(
  () => ({})
)

const isVatPercentageUsedInOrderItemsMock = require('@verkkokauppa/order-backend').isVatPercentageUsedInOrderItems.mockImplementation(
  () => ({})
)
const getEndOfDayInFinlandMock = require('@verkkokauppa/order-backend').getEndOfDayInFinland.mockImplementation(
  () => ({})
)

const savePaymentFiltersAdminMock = require('@verkkokauppa/payment-backend').savePaymentFiltersAdmin.mockImplementation(
  () => ({})
)

const getProductMappingMock = require('@verkkokauppa/product-mapping-backend').getProductMapping.mockImplementation(
  () => ({})
)

const orderMock = {
  orderId: '145d8829-07b7-4b03-ab0e-24063958ab9b',
  namespace: 'testNameSpace',
  user: 'test@test.dev.hel',
  createdAt: '1619157868',
  type: 'order',
  status: 'draft',
  customer: undefined,
  subscriptionId: undefined,
}

const orderCustomerMock = {
  firstName: 'Customer',
  lastName: 'Name',
  email: 'test@test.dev.hel',
  phone: '+358401231233',
}

const orderWithItemsMock = {
  order: {
    ...orderMock,
    ...orderCustomerMock,
    priceNet: '100',
    priceVat: '24',
    priceTotal: '124',
  },
  items: [
    {
      orderId: orderMock.orderId,
      merchantId: 'test-merchant-id-123',
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
}

const productMappingDataResponseMock = {
  productId: '30a245ed-5fca-4fcf-8b2a-cdf1ce6fca0d',
  namespace: 'testNameSpace',
  namespaceEntityId: 'test-namespace-id-123',
  merchantId: 'test-merchant-id-123',
}

const paymentFiltersDataResponseMock = [
  {
    filterId: 'faa1a6f9-0f01-4d54-89bb-6ff2e7314124',
    createdAt: '1619157868',
    namespace: 'testNameSpace',
    referenceId: '145d8829-07b7-4b03-ab0e-24063958ab9b',
    referenceType: ReferenceType.ORDER,
    filterType: 'banks',
    value: 'testValue',
  },
]

const paymentFiltersDataRequestMock = [
  {
    filterId: '',
    createdAt: '',
    namespace: 'testNameSpace',
    referenceId: '145d8829-07b7-4b03-ab0e-24063958ab9b',
    referenceType: ReferenceType.ORDER,
    filterType: 'banks',
    value: 'testValue',
  },
]

const controller = new (class extends CreateController {
  testSchema = this.requestSchema

  implementation(req: ValidatedRequest<any>, res: Response): Promise<any> {
    return super.implementation(req, res)
  }

  respond = jest.fn()
})()

const responseMock = {} as any

beforeEach(() => {
  jest.clearAllMocks()
})

describe('Test CreateController', () => {
  it('Should throw validation error when order creation with items is done without customer data', async () => {
    await expect(
      controller.implementation(
        {
          body: {
            filterId: '',
            createdAt: '',
            namespace: 'testNameSpace',
            user: 'test@test.dev.hel',
            items: orderWithItemsMock.items,
            paymentFilters: paymentFiltersDataRequestMock,
          },
          get: () => 'test.com',
        },
        responseMock
      )
    ).rejects.toThrow('request-validation-failed')
  })

  it('Should throw validation error when payment filter lacks required properties', async () => {
    const paymentFiltersInvalidRequestMock = [
      {
        filterId: '',
        createdAt: '',
        namespace: '',
        referenceId: '',
        referenceType: ReferenceType.ORDER,
        filterType: 'banks',
        value: 'testValue',
      },
    ]

    await expect(
      controller.testSchema.validate({
        body: {
          namespace: 'testNameSpace',
          user: 'test@test.dev.hel',
          customer: orderCustomerMock,
          items: orderWithItemsMock.items,
          paymentFilters: paymentFiltersInvalidRequestMock,
        },
      })
    ).rejects.toThrow('body.paymentFilters[0].namespace is a required field')

    const paymentFiltersInvalidRequestMock2 = [
      {
        filterId: '',
        createdAt: '',
        namespace: 'testNameSpace',
        referenceId: '145d8829-07b7-4b03-ab0e-24063958ab9b',
        referenceType: ReferenceType.ORDER,
        value: 'testValue',
      },
    ]

    await expect(
      controller.testSchema.validate({
        body: {
          namespace: 'testNameSpace',
          user: 'test@test.dev.hel',
          customer: orderCustomerMock,
          items: orderWithItemsMock.items,
          paymentFilters: paymentFiltersInvalidRequestMock2,
        },
      })
    ).rejects.toThrow('body.paymentFilters[0].filterType is a required field')

    const paymentFiltersInvalidRequestMock3 = [
      {
        filterId: '',
        createdAt: '',
        namespace: 'testNameSpace',
        referenceId: '',
        referenceType: ReferenceType.ORDER,
        filterType: 'banks',
        value: '',
      },
    ]

    await expect(
      controller.testSchema.validate({
        body: {
          namespace: 'testNameSpace',
          user: 'test@test.dev.hel',
          customer: orderCustomerMock,
          items: orderWithItemsMock.items,
          paymentFilters: paymentFiltersInvalidRequestMock3,
        },
      })
    ).rejects.toThrow('body.paymentFilters[0].value is a required field')
  })

  it('Should return created order with payment filters', async () => {
    const mockServiceResponseData = {
      order: orderMock,
    }
    createOrderMock.mockImplementationOnce(() => mockServiceResponseData)
    savePaymentFiltersAdminMock.mockImplementationOnce(
      () => paymentFiltersDataResponseMock
    )

    await controller.implementation(
      {
        body: {
          namespace: 'testNameSpace',
          user: 'test@test.dev.hel',
          paymentFilters: paymentFiltersDataRequestMock,
        },
        get: () => 'test.com',
      },
      responseMock
    )
    expect(createOrderMock).toHaveBeenCalledTimes(1)
    expect(controller.respond.mock.calls[0][2]).toMatchObject({
      order: { ...orderMock },
      paymentFilters: [...paymentFiltersDataResponseMock],
    })
  })

  it('Should return created order with items and payment filters', async () => {
    getProductMappingMock.mockImplementation(
      () => productMappingDataResponseMock
    )
    createOrderWithItemsMock.mockImplementationOnce(() => orderWithItemsMock)
    savePaymentFiltersAdminMock.mockImplementationOnce(
      () => paymentFiltersDataResponseMock
    )
    await controller.implementation(
      {
        body: {
          namespace: 'testNameSpace',
          user: 'test@test.dev.hel',
          items: orderWithItemsMock.items,
          customer: orderCustomerMock,
          paymentFilters: paymentFiltersDataRequestMock,
        },
        get: () => 'test.com',
      },
      responseMock
    )
    expect(createOrderWithItemsMock).toHaveBeenCalledTimes(1)
    expect(controller.respond.mock.calls[0][2]).toMatchObject({
      ...orderWithItemsMock,
      paymentFilters: [...paymentFiltersDataResponseMock],
    })
  })

  it('Should return created order with items and payment filters and add lastValidpurchase datetime if vatpercentage is 24', async () => {
    getProductMappingMock.mockImplementation(
      () => productMappingDataResponseMock
    )
    createOrderWithItemsMock.mockImplementationOnce(() => orderWithItemsMock)
    savePaymentFiltersAdminMock.mockImplementationOnce(
      () => paymentFiltersDataResponseMock
    )
    isVatPercentageUsedInOrderItemsMock.mockImplementationOnce(() => true)
    const lastValidPurchaseDateTime = new Date('2024-08-31T23:59:59.999Z')
    getEndOfDayInFinlandMock.mockImplementationOnce(
      () => lastValidPurchaseDateTime
    )

    await controller.implementation(
      {
        body: {
          namespace: 'testNameSpace',
          user: 'test@test.dev.hel',
          items: orderWithItemsMock.items,
          customer: orderCustomerMock,
          paymentFilters: paymentFiltersDataRequestMock,
        },
        get: () => 'test.com',
      },
      { ...responseMock }
    )
    expect(controller.respond.mock.calls[0][1]).toEqual(201)
    expect(createOrderWithItemsMock).toHaveBeenCalledTimes(1)
    expect(controller.respond.mock.calls[0][2]).toMatchObject({
      ...orderWithItemsMock,
      paymentFilters: [...paymentFiltersDataResponseMock],
    })
  })
})
