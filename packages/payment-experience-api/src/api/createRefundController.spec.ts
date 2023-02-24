import type { Response } from 'express'
import type { ValidatedRequest } from '@verkkokauppa/core'
import { CreateRefundController } from './createRefundController'

jest.mock('@verkkokauppa/configuration-backend')
jest.mock('@verkkokauppa/order-backend')
jest.mock('@verkkokauppa/payment-backend')

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

const orderId = 'f1fe0aba-f6a7-3366-bfcf-d3f480db956f'

const confirmRefundAdminDataMock = {
  refundId: 'c6c2cec5-d1a8-4a91-8341-9c3eae0b441a',
  orderId: orderId,
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
  orderId: orderId,
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
const params = { orderId }

const responseMock = {} as any

beforeEach(() => {
  jest.clearAllMocks()
})

describe('Test CreateRefundController', () => {
  it('should validate api key', async () => {
    await controller.implementation({ body: [], headers, params }, responseMock)
    expect(validateApiKeyMock).toHaveBeenCalledTimes(1)
    expect(validateApiKeyMock.mock.calls[0][0]).toEqual({
      apiKey: 'ak1',
      namespace: 'ns1',
    })
  })
  it('should throw error if order has not been paid', async () => {
    paidPaymentExistsMock.mockImplementationOnce(() => false)
    await controller.implementation(
      {
        body: [],
        headers,
        params,
      },
      responseMock
    )
    expect(controller.respond.mock.calls[0][2]).toMatchObject({
      errors: [
        {
          code: 'request-validation-failed',
          message: `order ${orderId} must be paid first`,
        },
      ],
    })
  })
  it('should throw error if order has previously refunded items', async () => {
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
    getRefundsByOrderAdminMock.mockImplementationOnce(() => [
      {
        items: [
          { orderItemId: 'ooid2', quantity: 2 },
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
        body: [],
        headers,
        params,
        get: () => 'test.com',
      },
      responseMock
    )
    expect(controller.respond.mock.calls[0][2]).toEqual({
      errors: [
        {
          code: 'request-validation-failed',
          message:
            'refunded quantity (now: 10, previously: 9) cannot exceed orderItem ooid1 quantity 10',
        },
      ],
      refunds: [],
    })
  })
  it('should create refund', async () => {
    getOrderAdminMock.mockImplementationOnce(() => ({
      orderId: 'oid1',
      namespace: 'ns2',
      priceNet: '110',
      priceVat: '220',
      priceTotal: '330',
      items: [
        {
          orderItemId: 'ooid1',
          productId: 'pid1',
          quantity: 10,
          priceNet: '11',
          priceVat: '22',
          priceGross: '33',
          rowPriceNet: '110',
          rowPriceVat: '220',
          rowPriceTotal: '330',
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
        params,
      },
      responseMock
    )
    expect(createRefundMock).toHaveBeenCalledTimes(1)
    expect(createRefundMock.mock.calls[0][0]).toEqual({
      order: {
        orderId: 'oid1',
        namespace: 'ns2',
        priceNet: '110',
        priceVat: '220',
        priceTotal: '330',
        items: [
          {
            orderItemId: 'ooid1',
            productId: 'pid1',
            quantity: 10,
            priceNet: '11',
            priceVat: '22',
            priceGross: '33',
            rowPriceNet: '110',
            rowPriceVat: '220',
            rowPriceTotal: '330',
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
        params,
      },
      responseMock
    )

    expect(createRefundMock).toHaveBeenCalledTimes(1)
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
        body: [],
        headers,
        params,
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
        params,
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
