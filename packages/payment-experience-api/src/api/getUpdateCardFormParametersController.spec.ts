import { AbstractController, ValidatedRequest } from '@verkkokauppa/core'
import type { Response } from 'express'
import { GetUpdateCardFormParametersController } from './getUpdateCardFormParametersController'

jest.mock('@verkkokauppa/order-backend')
jest.mock('@verkkokauppa/payment-backend')

const getOrderMock = require('@verkkokauppa/order-backend').getOrder.mockImplementation(
  () => ({})
)

const getUpdatePaytrailCardFormParamsMock = require('@verkkokauppa/payment-backend').getUpdatePaytrailCardFormParams.mockImplementation(
  () => ({})
)

const orderMock = {
  orderId: 'test123',
  type: 'subscription',
  namespace: 'n1',
  paymentMethod: {
    name: 'payment method',
    code: 'payment-method',
    group: 'group',
    img: 'img/path',
    gateway: 'online-paytrail',
  },
  items: [
    {
      merchantId: 'test-merchant-id',
      productId: 'pid1',
      productName: 'n1',
      productLabel: 'pl1',
      productDescription: 'pd1',
      quantity: 1,
      unit: 'unit1',
      rowPriceNet: '50',
      rowPriceVat: '12',
      rowPriceTotal: '62',
      priceNet: '50',
      priceVat: '12',
      priceGross: '62',
      vatPercentage: '24',
      meta: [
        {
          key: 'mk1',
          value: 'mv1',
          label: 'ml1',
          visibleInCheckout: false,
          ordinal: '1',
        },
      ],
    },
    {
      merchantId: 'test-merchant-id',
      productId: 'pid2',
      productName: 'n2',
      productLabel: 'pl2',
      productDescription: 'pd2',
      quantity: 2,
      unit: 'unit2',
      rowPriceNet: '200',
      rowPriceVat: '48',
      rowPriceTotal: '248',
      priceNet: '100',
      priceVat: '24',
      priceGross: '124',
      vatPercentage: '24',
      meta: [
        {
          key: 'mk2',
          value: 'mv2',
          label: 'ml2',
          visibleInCheckout: false,
          ordinal: '1',
        },
      ],
    },
  ],
}

const cardFormParametersMock = {
  'checkout-account': 123,
  'checkout-algorithm': 'sha256',
  'checkout-method': 'POST',
  'checkout-nonce': '123456',
  'checkout-timestamp': '2023-01-18T08:11:17+00:00',
  'checkout-redirect-success-url': 'http://localhost:3000/redirect/success',
  'checkout-redirect-cancel-url': 'http://localhost:3000/redirect/cancel',
  signature: 'test-signature',
  'checkout-callback-success-url': 'http://localhost:3000/callback/success',
  'checkout-callback-cancel-url': 'http://localhost:3000/callback/cancel',
}

beforeEach(() => {
  jest.clearAllMocks()
})

const getUpdateCardFormParametersController = new (class extends GetUpdateCardFormParametersController {
  implementation(req: ValidatedRequest<any>, res: Response): Promise<any> {
    return super.implementation(req, res)
  }
})()

const mockResponse = ({
  status: () => ({ json: () => ({}) }),
} as any) as Response

const requestBody = {}
const requestHeaders = {}

const mockRequest = {
  params: { orderId: 'test123' },
  body: requestBody,
  headers: requestHeaders,
} as any

describe('Test getUpdateCardFormParametersController', () => {
  it('Should get update card form parameters for order', async () => {
    const successSpy = jest.spyOn(AbstractController.prototype, 'success')
    getOrderMock.mockImplementationOnce(() => orderMock)
    getUpdatePaytrailCardFormParamsMock.mockImplementationOnce(
      () => cardFormParametersMock
    )
    const res = await getUpdateCardFormParametersController.implementation(
      mockRequest,
      mockResponse
    )
    expect(successSpy).toHaveBeenCalledTimes(1)
    expect(successSpy.mock.calls[0]?.[0]).toBe(mockResponse)
    expect(successSpy.mock.calls[0]?.[1]).toMatchObject({
      ...cardFormParametersMock,
    })
    expect(res).toBe(successSpy.mock.results[0]?.value)
  })
  it('Should throw 400 when order is not subscription', async () => {
    const orderNotSubscriptionMock = {
      ...orderMock,
      type: 'order',
    }
    getOrderMock.mockImplementationOnce(() => orderNotSubscriptionMock)
    getUpdatePaytrailCardFormParamsMock.mockImplementationOnce(
      () => cardFormParametersMock
    )
    await expect(
      getUpdateCardFormParametersController.implementation(
        mockRequest,
        mockResponse
      )
    ).rejects.toThrow('failed-order-is-not-subscription')
  })
  it('Should throw 400 when gateway is not paytrail', async () => {
    const paymentMethodWrongGatewayMock = {
      name: 'payment method',
      code: 'payment-method',
      group: 'group',
      img: 'img/path',
      gateway: 'online',
    }
    const orderWrongGatewayMock = {
      ...orderMock,
      paymentMethod: paymentMethodWrongGatewayMock,
    }
    getOrderMock.mockImplementationOnce(() => orderWrongGatewayMock)
    getUpdatePaytrailCardFormParamsMock.mockImplementationOnce(
      () => cardFormParametersMock
    )
    await expect(
      getUpdateCardFormParametersController.implementation(
        mockRequest,
        mockResponse
      )
    ).rejects.toThrow('failed-gateway-type-is-not-paytrail')
  })
  it('Should throw 404 when merchantId is not found from order items', async () => {
    const itemsWithoutMerchantIdMock = [
      {
        productId: 'pid1',
        productName: 'n1',
        productLabel: 'pl1',
        productDescription: 'pd1',
        quantity: 1,
        unit: 'unit1',
        rowPriceNet: '50',
        rowPriceVat: '12',
        rowPriceTotal: '62',
        priceNet: '50',
        priceVat: '12',
        priceGross: '62',
        vatPercentage: '24',
        meta: [
          {
            key: 'mk1',
            value: 'mv1',
            label: 'ml1',
            visibleInCheckout: false,
            ordinal: '1',
          },
        ],
      },
      {
        productId: 'pid2',
        productName: 'n2',
        productLabel: 'pl2',
        productDescription: 'pd2',
        quantity: 2,
        unit: 'unit2',
        rowPriceNet: '200',
        rowPriceVat: '48',
        rowPriceTotal: '248',
        priceNet: '100',
        priceVat: '24',
        priceGross: '124',
        vatPercentage: '24',
        meta: [
          {
            key: 'mk2',
            value: 'mv2',
            label: 'ml2',
            visibleInCheckout: false,
            ordinal: '1',
          },
        ],
      },
    ]
    const orderWithoutMerchantIdMock = {
      ...orderMock,
      items: itemsWithoutMerchantIdMock,
    }
    getOrderMock.mockImplementationOnce(() => orderWithoutMerchantIdMock)
    getUpdatePaytrailCardFormParamsMock.mockImplementationOnce(
      () => cardFormParametersMock
    )
    await expect(
      getUpdateCardFormParametersController.implementation(
        mockRequest,
        mockResponse
      )
    ).rejects.toThrow('merchant-id-not-found')
  })
})
