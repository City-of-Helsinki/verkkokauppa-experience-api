import axios from 'axios'
import {
  createPaymentFromOrder,
  createMethodPartFromGateway,
  getPaymentForOrder,
  getPaymentStatus,
  getPaymentUrl,
  paidPaymentExists,
  savePaymentFiltersAdmin,
  filterPaymentMethodByGateway,
  filterPaymentMethodsByCode,
  isAllowedToPayWithInvoice,
  isFreeOrder,
} from './service'
import { PaymentGateway, ReferenceType } from './enums'
import { removeItem } from '@verkkokauppa/core'
import type { Order } from './types'

jest.mock('axios')
const axiosMock = axios as jest.Mocked<typeof axios>

const orderMock = {
  orderId: '145d8829-07b7-4b03-ab0e-24063958ab9b',
  namespace: 'testNameSpace',
  user: 'test@test.dev.hel',
  createdAt: '1619157868',
  type: 'order' as const,
  customer: {
    firstName: 'Firstname',
    lastName: 'Lastname',
    email: 'test@dev.hel',
  },
  items: [
    {
      orderId: '145d8829-07b7-4b03-ab0e-24063958ab9b',
      orderItemId: '19699acf-b0a3-440f-818f-e582825fa3a7',
      productId: '30a245ed-5fca-4fcf-8b2a-cdf1ce6fca0d',
      quantity: 2,
      productName: 'Product Name',
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

const paymentFiltersMock = [
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

beforeEach(() => {
  jest.clearAllMocks()
})

describe('Test Create Payment for Order', () => {
  it('Should throw error with no backend url set', async () => {
    process.env.PAYMENT_BACKEND_URL = ''
    await expect(
      createPaymentFromOrder({
        language: '',
        order: orderMock,
        paymentMethod: '',
        paymentMethodLabel: '',
        gateway: '',
        merchantId: '',
      })
    ).rejects.toThrow('No payment API backend URL set')
  })
  it('Should throw error with no payment method set', async () => {
    process.env.PAYMENT_BACKEND_URL = 'test.dev.hel'
    await expect(
      createPaymentFromOrder({
        language: '',
        order: orderMock,
        paymentMethod: '',
        paymentMethodLabel: '',
        gateway: '',
        merchantId: '',
      })
    ).rejects.toThrow()
  })
  it('Should throw error with incorrect payment method set', async () => {
    process.env.PAYMENT_BACKEND_URL = 'test.dev.hel'
    await expect(
      createPaymentFromOrder({
        language: '',
        order: orderMock,
        paymentMethod: 'asd',
        paymentMethodLabel: 'Asd',
        gateway: '',
        merchantId: '',
      })
    ).rejects.toThrow()
  })
  it('Should create payment correctly visma', async () => {
    process.env.PAYMENT_BACKEND_URL = 'test.dev.hel'
    const mockData = {
      paymentId: '',
      namespace: '',
      orderId: '',
      status: '',
      paymentMethod: '',
      paymentType: '',
      totalExclTax: '',
      total: '',
      taxAmount: '',
      description: '',
      additionalInfo: '',
      token: '',
    }
    axiosMock.post.mockResolvedValue({ data: mockData })
    const result = await createPaymentFromOrder({
      language: 'fi',
      order: orderMock,
      paymentMethod: 'nordea',
      paymentMethodLabel: 'Nordea',
      gateway: 'online',
      merchantId: 'merchantId',
    })
    expect(axiosMock.post).toHaveBeenCalledTimes(1)
    expect(axiosMock.post?.mock?.calls[0]![0]).toEqual(
      'test.dev.hel/payment/online/createFromOrder'
    )
    expect(axiosMock.post?.mock?.calls[0]![1]).toEqual({
      paymentMethod: 'nordea',
      paymentMethodLabel: 'Nordea',
      merchantId: 'merchantId',
      language: 'fi',
      order: {
        order: {
          orderId: '145d8829-07b7-4b03-ab0e-24063958ab9b',
          namespace: 'testNameSpace',
          user: 'test@test.dev.hel',
          createdAt: '1619157868',
          type: 'order',
          customer: orderMock.customer,
          customerFirstName: 'Firstname',
          customerLastName: 'Lastname',
          customerEmail: 'test@dev.hel',
          items: [
            {
              orderId: '145d8829-07b7-4b03-ab0e-24063958ab9b',
              orderItemId: '19699acf-b0a3-440f-818f-e582825fa3a7',
              productId: '30a245ed-5fca-4fcf-8b2a-cdf1ce6fca0d',
              quantity: 2,
              productName: 'Product Name',
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
        },
        items: [
          {
            orderId: '145d8829-07b7-4b03-ab0e-24063958ab9b',
            orderItemId: '19699acf-b0a3-440f-818f-e582825fa3a7',
            productId: '30a245ed-5fca-4fcf-8b2a-cdf1ce6fca0d',
            quantity: 2,
            productName: 'Product Name',
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
      },
    })
    expect(result).toEqual(mockData)
  })

  it('Should create payment correctly paytrail', async () => {
    process.env.PAYMENT_BACKEND_URL = 'test.dev.hel'
    const mockData = {
      paymentId: '',
      namespace: '',
      orderId: '',
      status: '',
      paymentMethod: '',
      paymentType: '',
      totalExclTax: '',
      total: '',
      taxAmount: '',
      description: '',
      additionalInfo: '',
      token: '',
    }
    axiosMock.post.mockResolvedValue({ data: mockData })
    const result = await createPaymentFromOrder({
      language: 'fi',
      order: orderMock,
      paymentMethod: 'nordea',
      paymentMethodLabel: 'Nordea',
      gateway: 'online-paytrail',
      merchantId: 'merchantId',
    })
    expect(axiosMock.post).toHaveBeenCalledTimes(1)
    expect(axiosMock.post?.mock?.calls[0]![0]).toEqual(
      'test.dev.hel/payment/paytrail/createFromOrder'
    )
    expect(axiosMock.post?.mock?.calls[0]![1]).toEqual({
      paymentMethod: 'nordea',
      paymentMethodLabel: 'Nordea',
      language: 'fi',
      merchantId: 'merchantId',
      order: {
        order: {
          orderId: '145d8829-07b7-4b03-ab0e-24063958ab9b',
          namespace: 'testNameSpace',
          user: 'test@test.dev.hel',
          createdAt: '1619157868',
          type: 'order',
          customer: orderMock.customer,
          customerFirstName: 'Firstname',
          customerLastName: 'Lastname',
          customerEmail: 'test@dev.hel',
          items: [
            {
              orderId: '145d8829-07b7-4b03-ab0e-24063958ab9b',
              orderItemId: '19699acf-b0a3-440f-818f-e582825fa3a7',
              productId: '30a245ed-5fca-4fcf-8b2a-cdf1ce6fca0d',
              quantity: 2,
              productName: 'Product Name',
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
        },
        items: [
          {
            orderId: '145d8829-07b7-4b03-ab0e-24063958ab9b',
            orderItemId: '19699acf-b0a3-440f-818f-e582825fa3a7',
            productId: '30a245ed-5fca-4fcf-8b2a-cdf1ce6fca0d',
            quantity: 2,
            productName: 'Product Name',
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
      },
    })
    expect(result).toEqual(mockData)
  })
})

describe('Test Get Payment Url', () => {
  it('Should throw error with no backend url set', async () => {
    process.env.PAYMENT_BACKEND_URL = ''
    await expect(
      getPaymentUrl({
        namespace: '',
        orderId: '',
        user: '',
        gateway: '',
      })
    ).rejects.toThrow('No payment API backend URL set')
  })
  it('Should get visma payment url correctly', async () => {
    process.env.PAYMENT_BACKEND_URL = 'test.dev.hel'
    const paymentUrl = 'https://test.dev.hel/token/123'
    axiosMock.get.mockResolvedValue({ data: paymentUrl })
    const result = await getPaymentUrl({
      namespace: 'test',
      orderId: 'test',
      user: 'test',
      gateway: PaymentGateway.VISMA,
    })
    expect(result).toEqual(paymentUrl)
  })
  it('Should get paytrail payment url correctly', async () => {
    process.env.PAYMENT_BACKEND_URL = 'test.dev.hel'
    const paymentUrl = 'https://pay.paytrail.com/payments/orderId'
    // axiosMock.get.mockResolvedValue({ data: paymentUrl })
    axiosMock.get.mockImplementation((url, data?: any) => {
      expect(url).toContain(`/payment/paytrail/url`)

      console.log(url)
      console.log(data)
      return Promise.resolve({ data: paymentUrl })
    })

    const result = await getPaymentUrl({
      namespace: 'test',
      orderId: 'test',
      user: 'test',
      gateway: PaymentGateway.PAYTRAIL,
    })
    expect(result).toEqual(paymentUrl)
  })

  it('Should get invoice payment url correctly', async () => {
    process.env.PAYMENT_BACKEND_URL = 'test.dev.hel'
    const paymentUrl = 'test.dev.hel/invoice'
    // axiosMock.get.mockResolvedValue({ data: paymentUrl })
    axiosMock.get.mockImplementation((url, data?: any) => {
      expect(url).toContain(`/payment/invoice/url`)

      console.log(url)
      console.log(data)
      return Promise.resolve({ data: paymentUrl })
    })

    const result = await getPaymentUrl({
      namespace: 'test',
      orderId: 'test',
      user: 'test',
      gateway: PaymentGateway.INVOICE,
    })
    expect(result).toEqual(paymentUrl)
  })

  it('Should create createPaymentMethodPartFromGateway correctly', async () => {
    const vismaResult = createMethodPartFromGateway(PaymentGateway.VISMA)
    expect(vismaResult).toEqual('online')

    const paytrailResult = createMethodPartFromGateway(PaymentGateway.PAYTRAIL)
    expect(paytrailResult).toEqual('paytrail')

    const invoiceResult = createMethodPartFromGateway(PaymentGateway.INVOICE)
    expect(invoiceResult).toEqual('invoice')

    const invalidResult = createMethodPartFromGateway('not-set')
    expect(invalidResult).toEqual('')
  })
})
describe('Test Get Payment Status', () => {
  it('Should throw error with no backend url set', async () => {
    process.env.PAYMENT_BACKEND_URL = ''
    await expect(
      getPaymentStatus({
        namespace: '',
        orderId: '',
        user: '',
      })
    ).rejects.toThrow('No payment API backend URL set')
  })
  it('Should get payment status correctly', async () => {
    process.env.PAYMENT_BACKEND_URL = 'test.dev.hel'
    const status = 'PAID'
    axiosMock.get.mockResolvedValue({ data: status })
    const result = await getPaymentStatus({
      namespace: 'test',
      orderId: 'test',
      user: 'test',
    })
    expect(result).toEqual(status)
  })
})

describe('Test Get Payment for order', () => {
  it('Should throw error with no backend url set', async () => {
    process.env.PAYMENT_BACKEND_URL = ''
    await expect(
      getPaymentForOrder({
        orderId: '',
        namespace: '',
        user: '',
      })
    ).rejects.toThrow('No payment API backend URL set')
  })
  it('Should get payment for order correctly', async () => {
    process.env.PAYMENT_BACKEND_URL = 'test.dev.hel'
    const mockData = {
      paymentId: 'pid1',
      namespace: 'namespace1',
      orderId: 'oid1',
      status: 'paid',
      paymentMethod: 'cash',
      paymentType: 'type',
      totalExclTax: '100',
      total: '124',
      taxAmount: '24',
      description: '',
      additionalInfo: '',
      token: '12345678',
    }
    axiosMock.get.mockResolvedValue({ data: mockData })
    const result = await getPaymentForOrder({
      orderId: 'test',
      namespace: 'test',
      user: '',
    })
    expect(result).toEqual(mockData)
  })
})

describe('Test paidPaymentExists', () => {
  process.env.PAYMENT_BACKEND_URL = 'test.dev.hel'
  const params = {
    orderId: 'oid1',
    namespace: 'ns1',
    user: 'u1',
  }
  it('Should return true for an order with a paid payment', async () => {
    axiosMock.get.mockResolvedValue({ data: { status: 'payment_paid_online' } })
    const res = await paidPaymentExists(params)
    expect(res).toEqual(true)
  })
  it('Should return false for an order with a created payment', async () => {
    axiosMock.get.mockResolvedValue({ data: { status: 'payment_created' } })
    const res = await paidPaymentExists(params)
    expect(res).toEqual(false)
  })
  it('Should return false for an order without a payment', async () => {
    axiosMock.get.mockRejectedValueOnce({ response: { status: 404 } })
    const res = await paidPaymentExists(params)
    expect(res).toEqual(false)
  })
  it('Should propagate failure', async () => {
    axiosMock.get.mockRejectedValueOnce({ response: { status: 500 } })
    await expect(paidPaymentExists(params)).rejects.toThrow()
  })
})

describe('Test save payment filters for order', () => {
  it('Should throw error with no backend url set', async () => {
    process.env.PAYMENT_BACKEND_URL = ''
    await expect(savePaymentFiltersAdmin(paymentFiltersMock)).rejects.toThrow(
      'No payment API backend URL set'
    )
  })

  it('Should save payment filters for order', async () => {
    process.env.PAYMENT_BACKEND_URL = 'test.dev.hel'

    const paymentFilterReqeustDataMock = [
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

    axiosMock.post.mockResolvedValue({ data: paymentFiltersMock })
    const result = await savePaymentFiltersAdmin(paymentFilterReqeustDataMock)

    expect(axiosMock.post?.mock?.calls[0]![0]).toEqual(
      'test.dev.hel/payment-admin/online/save-payment-filters'
    )
    expect(axiosMock.post?.mock?.calls[0]![1]).toEqual([
      {
        filterId: 'faa1a6f9-0f01-4d54-89bb-6ff2e7314124',
        createdAt: '1619157868',
        namespace: 'testNameSpace',
        referenceId: '145d8829-07b7-4b03-ab0e-24063958ab9b',
        referenceType: ReferenceType.ORDER,
        filterType: 'banks',
        value: 'testValue',
      },
    ])
    expect(result).toEqual(paymentFiltersMock)
  })
})

describe('Test global payment filtering', () => {
  it('Should filter out payment methods with gateway filtering', async () => {
    const vismaNordeaB2BPaymentMethod = {
      name: 'visma',
      code: 'nordeab2b',
      group: 'group',
      img: 'img',
      gateway: PaymentGateway.VISMA.toString(),
    }
    const paytrailNordeaPaymentMethod = {
      name: 'paytrail',
      code: 'nordea',
      group: 'group-2',
      img: 'img-2',
      gateway: PaymentGateway.PAYTRAIL.toString(),
    }
    const paymentMethods = [
      vismaNordeaB2BPaymentMethod,
      paytrailNordeaPaymentMethod,
    ]
    const gateways = `${PaymentGateway.PAYTRAIL},${PaymentGateway.INVOICE}`

    const globallyFilteredPaymentGateways = gateways.split(',')

    expect(
      filterPaymentMethodByGateway(
        paymentMethods,
        globallyFilteredPaymentGateways
      )
    ).toEqual([vismaNordeaB2BPaymentMethod])
  })

  it('Should filter out payment methods with gateway and code filtering', async () => {
    const vismaNordeaB2BPaymentMethod = {
      name: 'visma',
      code: 'nordeab2b',
      group: 'group',
      img: 'img',
      gateway: PaymentGateway.VISMA.toString(),
    }
    const paytrailNordeaPaymentMethod = {
      name: 'paytrail',
      code: 'nordea',
      group: 'group-2',
      img: 'img-2',
      gateway: PaymentGateway.PAYTRAIL.toString(),
    }
    const paymentMethods = [
      vismaNordeaB2BPaymentMethod,
      paytrailNordeaPaymentMethod,
    ]
    const gateways = `${PaymentGateway.PAYTRAIL},${PaymentGateway.INVOICE}`
    const globallyFilteredPaymentGateways = gateways.split(',')

    const methods = 'nordeab2b'
    const globallyFilteredPaymentMethods = methods.split(',')

    let actual = filterPaymentMethodByGateway(
      paymentMethods,
      globallyFilteredPaymentGateways
    )

    actual = filterPaymentMethodsByCode(actual, globallyFilteredPaymentMethods)

    expect(actual).toEqual([])
  })

  test('should remove PaymentGateway.INVOICE if all items have invoicingDate and they are the same', () => {
    // Sample data
    const order = ({
      items: [
        { invoicingDate: '2024-04-12' },
        { invoicingDate: '2024-04-12' },
        { invoicingDate: '2024-04-12' },
      ],
    } as unknown) as Order

    // Sample globallyFilteredPaymentGateways
    let globallyFilteredPaymentGateways = [PaymentGateway.INVOICE]

    if (isAllowedToPayWithInvoice(order)) {
      // Call the function to be tested
      globallyFilteredPaymentGateways = removeItem(
        globallyFilteredPaymentGateways,
        PaymentGateway.INVOICE
      )
    }

    // Expect globallyFilteredPaymentGateways to be empty (PaymentGateway.INVOICE should be removed)
    expect(globallyFilteredPaymentGateways).toEqual([])
  })

  test('should not remove PaymentGateway.INVOICE if any item does not have invoicingDate', () => {
    // Sample data with one item missing invoicingDate
    const order = ({
      items: [
        { invoicingDate: '2024-04-12' },
        { invoicingDate: '2024-04-12' },
        {}, // Missing invoicingDate
      ],
    } as unknown) as Order

    // Sample globallyFilteredPaymentGateways
    let globallyFilteredPaymentGateways = [PaymentGateway.INVOICE]

    if (isAllowedToPayWithInvoice(order)) {
      // Call the function to be tested
      globallyFilteredPaymentGateways = removeItem(
        globallyFilteredPaymentGateways,
        PaymentGateway.INVOICE
      )
    }

    // Expect globallyFilteredPaymentGateways to still contain PaymentGateway.INVOICE
    expect(globallyFilteredPaymentGateways).toEqual([PaymentGateway.INVOICE])
  })

  test('should remove PaymentGateway.INVOICE if invoicingDate is different among items', () => {
    // Sample data with different invoicingDates
    const order = ({
      items: [
        { invoicingDate: '2024-04-12' },
        { invoicingDate: '2024-04-13' }, // Different invoicingDate
        { invoicingDate: '2024-04-12' },
      ],
    } as unknown) as Order

    // Sample globallyFilteredPaymentGateways
    let globallyFilteredPaymentGateways = [PaymentGateway.INVOICE]

    if (isAllowedToPayWithInvoice(order)) {
      // Call the function to be tested
      globallyFilteredPaymentGateways = removeItem(
        globallyFilteredPaymentGateways,
        PaymentGateway.INVOICE
      )
    }

    // Expect globallyFilteredPaymentGateways to to be empty
    expect(globallyFilteredPaymentGateways).toEqual([])
  })
})

describe('Payment Gateway Filtering', () => {
  it('should only allow FREE payment method when the order is free', () => {
    let filteredPaymentFilters = [
      {
        gateway: PaymentGateway.PAYTRAIL,
        name: 'Paytrail',
        code: 'pt',
        group: 'online',
        img: 'paytrail.png',
      },
      {
        gateway: PaymentGateway.FREE,
        name: 'Free',
        code: 'free',
        group: 'free',
        img: 'free.png',
      },
      {
        gateway: PaymentGateway.INVOICE,
        name: 'Invoice',
        code: 'inv',
        group: 'offline',
        img: 'invoice.png',
      },
    ]

    let globallyFilteredPaymentGateways = [
      PaymentGateway.PAYTRAIL,
      PaymentGateway.FREE,
      PaymentGateway.INVOICE,
    ]

    const order = ({ priceTotal: 0 } as unknown) as Order

    if (isFreeOrder(order)) {
      filteredPaymentFilters = filteredPaymentFilters.filter(
        (paymentFilters) => {
          return (
            paymentFilters?.gateway?.toLowerCase() ===
            PaymentGateway.FREE.toString().toLowerCase()
          )
        }
      )

      globallyFilteredPaymentGateways = removeItem(
        globallyFilteredPaymentGateways,
        PaymentGateway.FREE
      )
    }

    expect(filteredPaymentFilters).toEqual([
      {
        gateway: PaymentGateway.FREE,
        name: 'Free',
        code: 'free',
        group: 'free',
        img: 'free.png',
      },
    ])
    expect(globallyFilteredPaymentGateways).toEqual([
      PaymentGateway.PAYTRAIL,
      PaymentGateway.INVOICE,
    ])
  })

  it('should not filter payment methods when the order is not free', () => {
    let filteredPaymentFilters = [
      {
        gateway: PaymentGateway.PAYTRAIL,
        name: 'Paytrail',
        code: 'pt',
        group: 'online',
        img: 'paytrail.png',
      },
      {
        gateway: PaymentGateway.FREE,
        name: 'Free',
        code: 'free',
        group: 'free',
        img: 'free.png',
      },
      {
        gateway: PaymentGateway.INVOICE,
        name: 'Invoice',
        code: 'inv',
        group: 'offline',
        img: 'invoice.png',
      },
    ]

    let globallyFilteredPaymentGateways = [
      PaymentGateway.PAYTRAIL,
      PaymentGateway.FREE,
      PaymentGateway.INVOICE,
    ]

    const order = ({ priceTotal: 100 } as unknown) as Order

    if (isFreeOrder(order)) {
      filteredPaymentFilters = filteredPaymentFilters.filter(
        (paymentFilters) => {
          return (
            paymentFilters?.gateway?.toLowerCase() ===
            PaymentGateway.FREE.toString().toLowerCase()
          )
        }
      )

      globallyFilteredPaymentGateways = removeItem(
        globallyFilteredPaymentGateways,
        PaymentGateway.FREE
      )
    }

    expect(filteredPaymentFilters).toHaveLength(3)
    expect(globallyFilteredPaymentGateways).toEqual([
      PaymentGateway.PAYTRAIL,
      PaymentGateway.FREE,
      PaymentGateway.INVOICE,
    ])
  })

  it('should throw an error for invalid priceTotal', () => {
    const order = ({ priceTotal: 'invalid' } as unknown) as Order

    expect(() => isFreeOrder(order)).toThrow('Invalid priceTotal value')
  })

  it('should handle priceTotal as a string that can be parsed', () => {
    const order = ({ priceTotal: '0.0' } as unknown) as Order

    expect(isFreeOrder(order)).toBe(true)
  })

  it('should return false for undefined priceTotal', () => {
    const order = ({} as unknown) as Order

    expect(isFreeOrder(order)).toBe(false)
  })
})
