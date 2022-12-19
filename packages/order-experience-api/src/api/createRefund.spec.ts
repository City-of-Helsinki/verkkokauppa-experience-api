import type { Response } from 'express'
import type { ValidatedRequest } from '@verkkokauppa/core'
import { CreateRefundController } from './createRefund'

jest.mock('@verkkokauppa/order-backend')
jest.mock('@verkkokauppa/payment-backend')
jest.mock('@verkkokauppa/configuration-backend')

const getOrderAdminMock = require('@verkkokauppa/order-backend').getOrderAdmin.mockImplementation(
  () => ({})
)

const createRefundMock = require('@verkkokauppa/order-backend').createRefund.mockImplementation(
  () => ({})
)

const getRefundsByOrderAdminMock = require('@verkkokauppa/order-backend').getRefundsByOrderAdmin.mockImplementation(
  () => []
)

const paidPaymentExistsMock = require('@verkkokauppa/payment-backend').paidPaymentExists.mockImplementation(
  () => true
)

const getPaidPaymentAdmin = require('@verkkokauppa/payment-backend').getPaidPaymentAdmin.mockImplementation(
  () => true
)

const confirmRefundAdminDataMock = {
  refundId: 'c6c2cec5-d1a8-4a91-8341-9c3eae0b441a',
  orderId: 'f1fe0aba-f6a7-3366-bfcf-d3f480db956f',
  namespace: 'venepaikat',
  user: 'dummy_user',
  status: 'confirmed',
  customerFirstName: 'dummy_firstname',
  customerLastName: 'dummy_lastname',
  customerEmail: 'test@ambientia.fi',
  customerPhone: '',
  priceNet: '100',
  priceVat: '100',
  priceTotal: '100',
}

const confirmRefundAdmin = require('@verkkokauppa/order-backend').confirmRefundAdmin.mockImplementation(
  () => confirmRefundAdminDataMock
)
const mockRefundPayment = {
  refundPaymentId: 'c6c2cec5-d1a8-4a91-8341-9c3eae0b441a_at_20221124-172600',
  refundTransactionId: '6223e29e-6c0c-11ed-9373-dffeb4b88b35',
  namespace: 'venepaikat',
  orderId: 'f1fe0aba-f6a7-3366-bfcf-d3f480db956f',
  userId: 'dummy_user',
  status: 'refund_created',
  refundMethod: 'nordea',
  refundType: 'order',
  refundGateway: 'paytrail',
  totalExclTax: 100,
  total: 100,
  taxAmount: 100,
  timestamp: '20221124-172706',
  createdAt: '2022-11-24T17:27:06.5045602',
  updatedAt: null,
}

const createRefundPaymentFromRefund = require('@verkkokauppa/payment-backend').createRefundPaymentFromRefund.mockImplementation(
  () => {
    return mockRefundPayment
  }
)

const validateApiKeyMock = require('@verkkokauppa/configuration-backend').validateApiKey.mockImplementation(
  () => undefined
)

const controller = new (class extends CreateRefundController {
  implementation(req: ValidatedRequest<any>, res: Response): Promise<any> {
    return super.implementation(req, res)
  }

  respond = jest.fn()
})({ confirmAndCreatePayment: false })

const controllerConfirmAndCreate = new (class extends CreateRefundController {
  implementation(req: ValidatedRequest<any>, res: Response): Promise<any> {
    return super.implementation(req, res)
  }

  respond = jest.fn()
})({ confirmAndCreatePayment: true })

const headers = { 'api-key': 'ak1', namespace: 'ns1' }

const responseMock = {} as any

beforeEach(() => {
  jest.clearAllMocks()
})

describe('Test CreateRefundController', () => {
  it('should validate api key', async () => {
    await controller.implementation({ body: [], headers }, responseMock)
    expect(validateApiKeyMock).toHaveBeenCalledTimes(1)
    expect(validateApiKeyMock.mock.calls[0][0]).toEqual({
      apiKey: 'ak1',
      namespace: 'ns1',
    })
  })
  it('should respond 200 ok with refunds and errors in body', async () => {
    await controller.implementation({ body: [], headers }, responseMock)
    expect(controller.respond).toHaveBeenCalledTimes(1)
    expect(controller.respond.mock.calls[0][0]).toBe(responseMock)
    expect(controller.respond.mock.calls[0][1]).toEqual(200)
    expect(controller.respond.mock.calls[0][2]).toEqual({
      refunds: [],
      errors: [],
    })
  })
  it('should error if body contains duplicate orderIds', async () => {
    await controller.implementation(
      { body: [{ orderId: 'oid1' }, { orderId: 'oid1' }], headers },
      responseMock
    )
    expect(controller.respond.mock.calls[0][2]).toMatchObject({
      errors: [
        {
          code: 'request-validation-failed',
          message: 'body contains duplicate orderId oid1',
        },
        {
          code: 'request-validation-failed',
          message: 'body contains duplicate orderId oid1',
        },
      ],
    })
  })
  it('should error if items contain duplicate orderItemIds', async () => {
    await controller.implementation(
      {
        body: [
          {
            orderId: 'oid1',
            items: [{ orderItemId: 'ooid1' }, { orderItemId: 'ooid1' }],
          },
        ],
        headers,
      },
      responseMock
    )
    expect(controller.respond.mock.calls[0][2]).toMatchObject({
      errors: [
        {
          code: 'request-validation-failed',
          message: 'body[0].items contains duplicate orderItemId ooid1',
        },
      ],
    })
  })
  it('should error if order has not been paid', async () => {
    paidPaymentExistsMock.mockImplementationOnce(() => false)
    await controller.implementation(
      {
        body: [
          {
            orderId: 'oid1',
            items: [{ orderItemId: 'ooid1' }],
          },
        ],
        headers,
      },
      responseMock
    )
    expect(controller.respond.mock.calls[0][2]).toMatchObject({
      errors: [
        {
          code: 'request-validation-failed',
          message: 'order oid1 must be paid first',
        },
      ],
    })
  })
  it('should error if order has no orderItem with specified orderItemId', async () => {
    getOrderAdminMock.mockImplementationOnce(() => ({ items: [] }))
    await controller.implementation(
      {
        body: [
          {
            orderId: 'oid1',
            items: [{ orderItemId: 'ooid1' }],
          },
        ],
        headers,
      },
      responseMock
    )
    expect(controller.respond.mock.calls[0][2]).toMatchObject({
      errors: [
        {
          code: 'request-validation-failed',
          message: 'order oid1 does not contain orderItem ooid1',
        },
      ],
    })
  })
  it('should error if item quantity exceeds order item quantity', async () => {
    getOrderAdminMock.mockImplementationOnce(() => ({
      items: [{ orderItemId: 'ooid1', quantity: 1 }],
    }))
    await controller.implementation(
      {
        body: [
          {
            orderId: 'oid1',
            items: [{ orderItemId: 'ooid1', quantity: 2 }],
          },
        ],
        headers,
      },
      responseMock
    )
    expect(controller.respond.mock.calls[0][2]).toMatchObject({
      errors: [
        {
          code: 'request-validation-failed',
          message:
            'refunded quantity (now: 2, previously: 0) cannot exceed orderItem ooid1 quantity 1',
        },
      ],
    })
  })
  it('should error if item quantity with refunded quantity exceeds order item quantity', async () => {
    getOrderAdminMock.mockImplementationOnce(() => ({
      items: [{ orderItemId: 'ooid1', quantity: 10 }],
    }))
    getRefundsByOrderAdminMock.mockImplementationOnce(() => [
      {
        items: [
          { orderItemId: 'ooid2', quantity: 200 },
          { orderItemId: 'ooid1', quantity: 3 },
        ],
      },
      {
        items: [{ orderItemId: 'ooid1', quantity: 4 }],
      },
      {
        items: [{ orderItemId: 'ooid1', quantity: 2 }],
      },
    ])
    await controller.implementation(
      {
        body: [
          {
            orderId: 'oid1',
            items: [{ orderItemId: 'ooid1', quantity: 2 }],
          },
        ],
        headers,
      },
      responseMock
    )
    expect(controller.respond.mock.calls[0][2]).toMatchObject({
      errors: [
        {
          code: 'request-validation-failed',
          message:
            'refunded quantity (now: 2, previously: 9) cannot exceed orderItem ooid1 quantity 10',
        },
      ],
    })
  })
  it('should create refund', async () => {
    getOrderAdminMock.mockImplementationOnce(() => ({
      orderId: 'oid1',
      namespace: 'ns2',
      priceNet: '111',
      priceVat: '222',
      priceTotal: '333',
      items: [
        {
          orderItemId: 'ooid1',
          productId: 'pid1',
          quantity: 10,
          priceNet: '11',
          priceVat: '22',
          priceGross: '33',
          rowPriceNet: '111',
          rowPriceVat: '222',
          rowPriceTotal: '333',
        },
      ],
    }))
    await controller.implementation(
      {
        body: [
          {
            orderId: 'oid1',
            items: [{ orderItemId: 'ooid1', quantity: 2 }],
          },
        ],
        headers,
      },
      responseMock
    )
    expect(createRefundMock).toHaveBeenCalledTimes(1)
    expect(createRefundMock.mock.calls[0][0]).toEqual({
      order: {
        orderId: 'oid1',
        namespace: 'ns2',
        priceNet: '22',
        priceVat: '44',
        priceTotal: '66',
        items: [
          {
            orderItemId: 'ooid1',
            productId: 'pid1',
            quantity: 2,
            priceNet: '11',
            priceVat: '22',
            priceGross: '33',
            rowPriceNet: '22',
            rowPriceVat: '44',
            rowPriceTotal: '66',
          },
        ],
      },
    })
  })

  it('should create refund with refund payment', async () => {
    getOrderAdminMock.mockImplementationOnce(() => ({
      orderId: 'oid1',
      namespace: 'ns2',
      priceNet: '111',
      priceVat: '222',
      priceTotal: '333',
      items: [
        {
          orderItemId: 'ooid1',
          productId: 'pid1',
          quantity: 10,
          priceNet: '11',
          priceVat: '22',
          priceGross: '33',
          rowPriceNet: '111',
          rowPriceVat: '222',
          rowPriceTotal: '333',
        },
      ],
    }))

    createRefundMock.mockImplementationOnce(() => ({
      orderId: 'oid1',
      namespace: 'ns2',
      priceNet: '111',
      priceVat: '222',
      priceTotal: '333',
      items: [
        {
          orderItemId: 'ooid1',
          productId: 'pid1',
          quantity: 10,
          priceNet: '11',
          priceVat: '22',
          priceGross: '33',
          rowPriceNet: '111',
          rowPriceVat: '222',
          rowPriceTotal: '333',
          merchantId: '333',
        },
      ],
    }))

    await controllerConfirmAndCreate.implementation(
      {
        body: [
          {
            orderId: 'oid1',
            items: [{ orderItemId: 'ooid1', quantity: 2 }],
          },
        ],
        headers,
      },
      responseMock
    )

    expect(createRefundMock).toHaveBeenCalledTimes(1)
    //expect(createRefundPaymentFromRefund).toHaveBeenCalledTimes(1)
    expect(createRefundPaymentFromRefund.mock.calls[0][0]).toEqual({
      gateway: 'online-paytrail',
      merchantId: '333',
      order: {
        items: [
          {
            orderItemId: 'ooid1',
            priceGross: '33',
            priceNet: '11',
            priceVat: '22',
            productId: 'pid1',
            quantity: 10,
            rowPriceNet: '111',
            rowPriceTotal: '333',
            rowPriceVat: '222',
          },
        ],
        namespace: 'ns2',
        orderId: 'oid1',
        priceNet: '111',
        priceTotal: '333',
        priceVat: '222',
      },
      payment: true,
      // This is refundAggregateDto
      refund: {
        items: [
          {
            merchantId: '333',
            orderItemId: 'ooid1',
            priceGross: '33',
            priceNet: '11',
            priceVat: '22',
            productId: 'pid1',
            quantity: 10,
            rowPriceNet: '111',
            rowPriceTotal: '333',
            rowPriceVat: '222',
          },
        ],
        refund: {
          customerEmail: 'test@ambientia.fi',
          customerFirstName: 'dummy_firstname',
          customerLastName: 'dummy_lastname',
          customerPhone: '',
          namespace: 'venepaikat',
          orderId: 'f1fe0aba-f6a7-3366-bfcf-d3f480db956f',
          priceNet: '100',
          priceTotal: '100',
          priceVat: '100',
          refundId: 'c6c2cec5-d1a8-4a91-8341-9c3eae0b441a',
          status: 'confirmed',
          user: 'dummy_user',
        },
      },
    })

    expect(confirmRefundAdmin).toHaveBeenCalledTimes(1)

    expect(getPaidPaymentAdmin).toHaveBeenCalledTimes(1)
  })
  it('should return created refund with confirmation url', async () => {
    getOrderAdminMock.mockImplementationOnce(() => ({
      orderId: 'oid1',
      items: [
        {
          orderItemId: 'ooid1',
          quantity: 10,
          priceNet: '11',
          priceVat: '22',
          priceGross: '33',
        },
      ],
    }))
    createRefundMock.mockImplementationOnce(() => ({
      refund: {
        refundId: 'rid1',
      },
      items: [
        {
          refundItemId: 'riid1',
          refundId: 'rid1',
        },
      ],
    }))
    await controller.implementation(
      {
        body: [
          {
            orderId: 'oid1',
            items: [{ orderItemId: 'ooid1', quantity: 1 }],
          },
        ],
        headers,
        get: () => 'test.com',
      },
      responseMock
    )
    expect(controller.respond.mock.calls[0][2]).toMatchObject({
      refunds: [
        {
          refundId: 'rid1',
          items: [
            {
              refundId: 'rid1',
              refundItemId: 'riid1',
            },
          ],
          confirmationUrl: 'test.com/refund/rid1/confirm',
        },
      ],
    })
  })
  it('should return refunds and errors alongside', async () => {
    getOrderAdminMock.mockImplementationOnce(() => ({
      orderId: 'oid1',
      items: [
        {
          orderItemId: 'ooid1',
          quantity: 10,
          priceNet: '11',
          priceVat: '22',
          priceGross: '33',
        },
      ],
    }))
    createRefundMock.mockImplementationOnce(() => ({
      refund: {
        refundId: 'rid1',
      },
      items: [],
    }))
    await controller.implementation(
      {
        body: [
          {
            orderId: 'oid2',
            items: [{ orderItemId: 'ooid2', quantity: 1 }],
          },
          {
            orderId: 'oid1',
            items: [{ orderItemId: 'ooid1', quantity: 1 }],
          },
          {
            orderId: 'oid2',
            items: [{ orderItemId: 'ooid3', quantity: 1 }],
          },
        ],
        headers,
        get: () => 'test.com',
      },
      responseMock
    )
    expect(controller.respond.mock.calls[0][2]).toEqual({
      errors: [
        {
          code: 'request-validation-failed',
          message: 'body contains duplicate orderId oid2',
        },
        {
          code: 'request-validation-failed',
          message: 'body contains duplicate orderId oid2',
        },
      ],
      refunds: [
        {
          refundId: 'rid1',
          items: [],
          confirmationUrl: 'test.com/refund/rid1/confirm',
        },
      ],
    })
  })
  it('should use order.items in refund if request items are undefined', async () => {
    getOrderAdminMock.mockImplementationOnce(() => ({
      orderId: 'oid1',
      items: [
        {
          orderItemId: 'ooid1',
          quantity: 10,
        },
      ],
    }))
    await controller.implementation(
      {
        body: [
          {
            orderId: 'oid1',
          },
        ],
        headers,
      },
      responseMock
    )
    expect(createRefundMock).toHaveBeenCalledTimes(1)
    expect(createRefundMock.mock.calls[0][0]).toMatchObject({
      order: {
        orderId: 'oid1',
        items: [
          {
            orderItemId: 'ooid1',
            quantity: 10,
          },
        ],
      },
    })
  })
})
