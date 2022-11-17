import { ConfirmAndCreatePayment } from './confirmAndCreatePayment'
import type { Request, Response } from 'express'

jest.mock('@verkkokauppa/order-backend')
jest.mock('@verkkokauppa/payment-backend')

const confirmOrderMock = require('@verkkokauppa/order-backend').confirmOrder.mockImplementation(
  () => ({})
)
const getPaymentMethodListMock = require('@verkkokauppa/payment-backend').getPaymentMethodList.mockImplementation(
  () => ({})
)
const createPaymentFromUnpaidOrderMock = require('@verkkokauppa/payment-backend').createPaymentFromUnpaidOrder.mockImplementation(
  () => ({})
)
const getPaymentUrlMock = require('@verkkokauppa/payment-backend').getPaymentUrl.mockImplementation(
  () => ({})
)

const orderMock = {
  orderId: 'test123',
  namespace: 'n1',
  merchantId: null,
  items: [
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
  ],
}

const paymentMethodListMock = [
  {
    name: 'Nordea',
    code: 'nordea',
    group: 'banks',
    img: 'http://localhost/image.png',
  },
]

beforeEach(() => {
  jest.clearAllMocks()
})

const confirmAndCreatePayment = new (class extends ConfirmAndCreatePayment {
  implementation(req: any, res: Response): Promise<any> {
    return super.implementation(req, res)
  }
})()

const mockResponse = ({
  status: () => ({ json: () => ({}) }),
} as any) as Response

const requestBody = {
  paymentMethod: 'nordea',
  language: 'fi',
}
const requestHeaders = {
  user: 'testUser',
}

describe('Test confirmAndCreatePayment', () => {
  it('Should confirm order correctly', async () => {
    confirmOrderMock.mockImplementationOnce(() => orderMock)
    getPaymentMethodListMock.mockImplementationOnce(() => paymentMethodListMock)
    createPaymentFromUnpaidOrderMock.mockImplementationOnce(() => {})
    getPaymentUrlMock.mockImplementationOnce(() => 'url.com')
    await confirmAndCreatePayment.implementation(
      {
        body: requestBody,
        headers: requestHeaders,
        params: { orderId: 'test123' },
      } as any,
      mockResponse
    )
    expect(confirmOrderMock).toHaveBeenCalledTimes(1)
    expect(confirmOrderMock.mock.calls[0][0]).toEqual({
      orderId: 'test123',
      user: 'testUser',
    })
    expect(getPaymentMethodListMock.mock.calls[0][0]).toEqual({
      merchantId: null,
      order: orderMock,
      namespace: orderMock.namespace,
      totalPrice: 310,
    })
    expect(createPaymentFromUnpaidOrderMock.mock.calls[0][0]).toEqual({
      order: orderMock,
      paymentMethod: requestBody.paymentMethod,
      paymentMethodLabel: paymentMethodListMock[0]?.name,
      language: requestBody.language,
      gateway: undefined,
      merchantId: null,
    })
    expect(getPaymentUrlMock.mock.calls[0][0]).toEqual(orderMock)
  })
  it('Should throw for unknown errors', async () => {
    confirmOrderMock.mockImplementationOnce(() => {
      throw new Error()
    })
    await expect(
      confirmAndCreatePayment.implementation(
        { body: requestBody } as Request,
        mockResponse
      )
    ).rejects.toThrow()
  })
})
