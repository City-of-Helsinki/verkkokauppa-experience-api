import type { Response } from 'express'
import type { ValidatedRequest } from '@verkkokauppa/core'
import { CreateController } from './createController'
import { FilterType, ReferenceType } from '@verkkokauppa/payment-backend'

jest.mock('@verkkokauppa/order-backend')
jest.mock('@verkkokauppa/payment-backend')

const createOrderMock = require('@verkkokauppa/order-backend').createOrder.mockImplementation(
  () => ({})
)

const createOrderWithItemsMock = require('@verkkokauppa/order-backend').createOrderWithItems.mockImplementation(
  () => ({})
)

const savePaymentFiltersAdminMock = require('@verkkokauppa/payment-backend').savePaymentFiltersAdmin.mockImplementation(
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

const paymentFiltersDataResponseMock = [
  {
    filterId: 'faa1a6f9-0f01-4d54-89bb-6ff2e7314124',
    createdAt: '1619157868',
    namespace: 'testNameSpace',
    referenceId: '145d8829-07b7-4b03-ab0e-24063958ab9b',
    referenceType: ReferenceType.ORDER,
    filterType: FilterType.ORDER,
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
    filterType: FilterType.ORDER,
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
        referenceId: '145d8829-07b7-4b03-ab0e-24063958ab9b',
        referenceType: ReferenceType.ORDER,
        filterType: FilterType.ORDER,
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
        referenceId: '',
        referenceType: ReferenceType.ORDER,
        filterType: FilterType.ORDER,
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
    ).rejects.toThrow('body.paymentFilters[0].referenceId is a required field')

    const paymentFiltersInvalidRequestMock3 = [
      {
        filterId: '',
        createdAt: '',
        namespace: 'testNameSpace',
        referenceId: '145d8829-07b7-4b03-ab0e-24063958ab9b',
        filterType: FilterType.ORDER,
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
          paymentFilters: paymentFiltersInvalidRequestMock3,
        },
      })
    ).rejects.toThrow(
      'body.paymentFilters[0].referenceType is a required field'
    )

    const paymentFiltersInvalidRequestMock4 = [
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
          paymentFilters: paymentFiltersInvalidRequestMock4,
        },
      })
    ).rejects.toThrow('body.paymentFilters[0].filterType is a required field')

    const paymentFiltersInvalidRequestMock5 = [
      {
        filterId: '',
        createdAt: '',
        namespace: 'testNameSpace',
        referenceId: '145d8829-07b7-4b03-ab0e-24063958ab9b',
        referenceType: ReferenceType.ORDER,
        filterType: FilterType.ORDER,
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
          paymentFilters: paymentFiltersInvalidRequestMock5,
        },
      })
    ).rejects.toThrow('body.paymentFilters[0].value is a required field')
  })

  it('Should throw validation error when payment filters have invalid reference and filter types', async () => {
    const paymentFiltersInvalidRequestMock = [
      {
        filterId: '',
        createdAt: '',
        namespace: 'testNameSpace',
        referenceId: '145d8829-07b7-4b03-ab0e-24063958ab9b',
        referenceType: 'not valid',
        filterType: FilterType.MERCHANT,
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
    ).rejects.toThrow(
      'body.paymentFilters[0].referenceType must be one of the following values: order, merchant'
    )

    const paymentFiltersInvalidRequestMock2 = [
      {
        filterId: '',
        createdAt: '',
        namespace: 'testNameSpace',
        referenceId: '145d8829-07b7-4b03-ab0e-24063958ab9b',
        referenceType: ReferenceType.MERCHANT,
        filterType: 'not valid',
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
    ).rejects.toThrow(
      'body.paymentFilters[0].filterType must be one of the following values: order, merchant'
    )

    // Ensure valid values work
    const paymentFiltersValidRequestMock = [
      {
        filterId: '',
        createdAt: '',
        namespace: 'testNameSpace',
        referenceId: '145d8829-07b7-4b03-ab0e-24063958ab9b',
        referenceType: ReferenceType.ORDER,
        filterType: FilterType.ORDER,
        value: 'testValue',
      },
    ]

    expect(
      await controller.testSchema.validate({
        body: {
          namespace: 'testNameSpace',
          user: 'test@test.dev.hel',
          customer: orderCustomerMock,
          items: orderWithItemsMock.items,
          paymentFilters: paymentFiltersValidRequestMock,
        },
      })
    ).toEqual({
      body: {
        namespace: 'testNameSpace',
        user: 'test@test.dev.hel',
        customer: orderCustomerMock,
        items: orderWithItemsMock.items,
        paymentFilters: paymentFiltersValidRequestMock,
      },
    })
    const paymentFiltersValidRequestMock2 = [
      {
        filterId: '',
        createdAt: '',
        namespace: 'testNameSpace',
        referenceId: '145d8829-07b7-4b03-ab0e-24063958ab9b',
        referenceType: ReferenceType.MERCHANT,
        filterType: FilterType.MERCHANT,
        value: 'testValue',
      },
    ]

    expect(
      await controller.testSchema.validate({
        body: {
          namespace: 'testNameSpace',
          user: 'test@test.dev.hel',
          customer: orderCustomerMock,
          items: orderWithItemsMock.items,
          paymentFilters: paymentFiltersValidRequestMock2,
        },
      })
    ).toEqual({
      body: {
        namespace: 'testNameSpace',
        user: 'test@test.dev.hel',
        customer: orderCustomerMock,
        items: orderWithItemsMock.items,
        paymentFilters: paymentFiltersValidRequestMock2,
      },
    })
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
})
