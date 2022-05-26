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

const validateApiKeyMock = require('@verkkokauppa/configuration-backend').validateApiKey.mockImplementation(
  () => undefined
)

const controller = new (class extends CreateRefundController {
  implementation(req: ValidatedRequest<any>, res: Response): Promise<any> {
    return super.implementation(req, res)
  }

  respond = jest.fn()
})()

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
          confirmationUrl: 'test.com/refund/rid1/confirmAndCreatePayment',
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
          confirmationUrl: 'test.com/refund/rid1/confirmAndCreatePayment',
        },
      ],
    })
  })
})
