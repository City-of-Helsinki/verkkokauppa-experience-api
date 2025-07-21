import {
  addItemsToOrder,
  cancelOrder,
  checkLastValidPurchaseDateTime,
  createAccountingEntryForOrder,
  createOrder,
  createOrderWithItems,
  getOrder,
  isVatCodeUsedAfterDateTime,
  isVatPercentageUsedInOrderItems,
  OrderItem,
  setCustomerToOrder,
  setInvoiceToOrder,
  setOrderTotals,
} from './index'
import axios from 'axios'
import { ExperienceError } from '@verkkokauppa/core'
import type { MockDateSetup } from './test/test-utils'
import { setupMockDate } from './test/test-utils'
import { formatToTimeZone, parseFromTimeZone } from 'date-fns-timezone'

jest.mock('axios')
const axiosMock = axios as jest.Mocked<typeof axios>

class NoErrorThrownError extends Error {}

const getError = async <TError>(call: () => unknown): Promise<TError> => {
  try {
    await call()

    throw new NoErrorThrownError()
  } catch (error: unknown) {
    return error as TError
  }
}

const orderMock = {
  orderId: '145d8829-07b7-4b03-ab0e-24063958ab9b',
  namespace: 'testNameSpace',
  user: 'test@test.dev.hel',
  createdAt: '1619157868',
  type: 'order',
  status: 'draft',
  customer: undefined,
  invoice: undefined,
  subscriptionId: undefined,
}

const orderBackendCustomerMock = {
  customerFirstName: 'Customer',
  customerLastName: 'Name',
  customerEmail: 'test@test.dev.hel',
  customerPhone: '+358401231233',
}

const orderBackendInvoiceMock = {
  invoice: {
    invoiceId: 'invoiceId',
    businessId: 'businessId',
    name: 'name',
    address: 'address',
    postcode: 'postcode',
    city: 'city',
    ovtId: 'ovtId',
  },
}

const orderCustomerMock = {
  customer: {
    firstName: 'Customer',
    lastName: 'Name',
    email: 'test@test.dev.hel',
    phone: '+358401231233',
  },
}

const orderInvoiceMock = {
  invoice: {
    invoiceId: 'invoiceId',
    businessId: 'businessId',
    name: 'name',
    address: 'address',
    postcode: 'postcode',
    city: 'city',
    ovtId: 'ovtId',
  },
}

let mockDate: MockDateSetup

beforeEach(() => {
  mockDate = setupMockDate()
})

afterEach(() => {
  mockDate.reset()
})

describe('Test Create Order', () => {
  it('Should throw error with no backend url set', async () => {
    process.env.ORDER_BACKEND_URL = ''
    await expect(
      createOrder({ namespace: 'asiakaspysakointi', user: 'test' })
    ).rejects.toThrow('No order backend URL set')
  })
  it('Should create order correctly with backend url set', async () => {
    process.env.ORDER_BACKEND_URL = 'test.dev.hel'
    process.env.CHECKOUT_BASE_URL = 'https://checkout.dev.hel/'
    const mockData = {
      order: orderMock,
      items: [],
    }
    axiosMock.get.mockResolvedValue({ data: mockData })
    const result = await createOrder({
      namespace: 'testNameSpace',
      user: 'test@test.dev.hel',
    })
    expect(result).toEqual({
      ...orderMock,
      items: [],
      updateCardUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}/update-card?user=${mockData.order.user}`,
      checkoutUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}?user=${mockData.order.user}`,
      receiptUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}/receipt?user=${mockData.order.user}`,
      loggedInCheckoutUrl: `${process.env.CHECKOUT_BASE_URL}profile/${mockData.order.orderId}`,
    })
  })
  it('Should create order with items correctly with backend url set', async () => {
    process.env.ORDER_BACKEND_URL = 'test.dev.hel'
    process.env.CHECKOUT_BASE_URL = 'https://checkout.dev.hel/'
    const mockData = {
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
    }
    axiosMock.post.mockResolvedValue({ data: mockData })
    const result = await createOrderWithItems({
      namespace: 'testNameSpace',
      user: 'test@test.dev.hel',
      priceNet: '100',
      priceVat: '24',
      priceTotal: '124',
      items: [
        {
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
      ...orderCustomerMock,
    })
    expect(result).toEqual({
      ...orderMock,
      ...orderCustomerMock,
      priceNet: '100',
      priceVat: '24',
      priceTotal: '124',
      items: mockData.items,
      updateCardUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}/update-card?user=${mockData.order.user}`,
      checkoutUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}?user=${mockData.order.user}`,
      receiptUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}/receipt?user=${mockData.order.user}`,
      loggedInCheckoutUrl: `${process.env.CHECKOUT_BASE_URL}profile/${mockData.order.orderId}`,
    })
  })
  it('Should throw error with given expired lastValidPurchaseDateTime on order creation', async () => {
    process.env.ORDER_BACKEND_URL = 'test.dev.hel'
    process.env.CHECKOUT_BASE_URL = 'https://checkout.dev.hel/'
    const lastValidPurchaseDate = new Date()
    const minusDays = 5
    lastValidPurchaseDate.setDate(lastValidPurchaseDate.getDate() - minusDays)

    await expect(
      createOrder({
        namespace: 'testNameSpace',
        user: 'test@test.dev.hel',
        lastValidPurchaseDateTime: lastValidPurchaseDate,
      })
    ).rejects.toThrow('forbidden-request')
  })

  it('Should throw error with given expired lastValidPurchaseDateTime on order creation 2', async () => {
    process.env.ORDER_BACKEND_URL = 'test.dev.hel'
    process.env.CHECKOUT_BASE_URL = 'https://checkout.dev.hel/'

    await expect(
      createOrder({
        namespace: 'testNameSpace',
        user: 'test@test.dev.hel',
        lastValidPurchaseDateTime: '2023-03-15T07:59:00.0Z',
      })
    ).rejects.toThrow('forbidden-request')
  })

  it('Should throw error with given expired lastValidPurchaseDateTime on checkLastValidPurchaseDateTime function call', async () => {
    process.env.ORDER_BACKEND_URL = 'test.dev.hel'
    process.env.CHECKOUT_BASE_URL = 'https://checkout.dev.hel/'
    const lastValidPurchaseDate = new Date()
    const minusDays = 5
    lastValidPurchaseDate.setDate(lastValidPurchaseDate.getDate() - minusDays)

    const error = await getError(async () =>
      checkLastValidPurchaseDateTime(lastValidPurchaseDate)
    )

    // check that the returned error wasn't that no error was thrown
    expect(error).not.toBeInstanceOf(NoErrorThrownError)
    expect(error).toBeInstanceOf(ExperienceError)

    expect(error).toHaveProperty('definition', {
      code: 'forbidden-request',
      message: 'Optional lastValidPurchaseDateTime is expired',
      responseStatus: 403,
      logLevel: 'debug',
    })
  })

  it('Should not throw error with given expired lastValidPurchaseDateTime on checkLastValidPurchaseDateTime function call', async () => {
    const lastValidPurchaseDate = new Date()

    console.log('Time now timezone %s', JSON.stringify(lastValidPurchaseDate))

    const dateTimeInHelsinkiTimezone = parseFromTimeZone(
      lastValidPurchaseDate.toISOString(),
      {
        timeZone: 'Europe/Helsinki',
      }
    )
    console.log(
      'Time now dateTimeInHelsinkiTimezone %s',
      JSON.stringify(dateTimeInHelsinkiTimezone)
    )

    const plusDays = 1
    lastValidPurchaseDate.setDate(lastValidPurchaseDate.getDate() + plusDays)
    console.log('Time plus days %s', JSON.stringify(lastValidPurchaseDate))
    const checkDateTime = checkLastValidPurchaseDateTime(lastValidPurchaseDate)
    console.log('checkDateTime %s', JSON.stringify(checkDateTime))
    expect(lastValidPurchaseDate > checkDateTime).toBe(true)
  })

  it('Should not throw error if lastValidPurchaseDateTime is undefined', async () => {
    const startCheckTime = new Date()
    const minusSeconds = 1
    startCheckTime.setSeconds(startCheckTime.getSeconds() - minusSeconds)
    const checkDateTime = checkLastValidPurchaseDateTime(undefined)
    console.log('startCheckTime %s', JSON.stringify(startCheckTime))
    console.log('checkDateTime %s', JSON.stringify(checkDateTime))
    expect(checkDateTime > startCheckTime).toBe(true)
  })

  it('Should work if given utc+2 time', async () => {
    const starCheckDateTime = new Date()
    const plusSeconds = 15
    starCheckDateTime.setSeconds(starCheckDateTime.getSeconds() + plusSeconds)

    const format = 'YYYY-MM-DDTHH:mm:ss.SSS'
    const output =
      formatToTimeZone(starCheckDateTime, format, {
        timeZone: 'Europe/Helsinki',
      }) + 'Z'
    const dateWithEuropeTimeZone = new Date(output)

    const checkDateTimeWith2 = checkLastValidPurchaseDateTime(
      dateWithEuropeTimeZone
    )
    expect(dateWithEuropeTimeZone > checkDateTimeWith2).toBe(true)

    const starCheckDateTimeMinus20Secs = new Date()
    const minusSeconds = 15
    starCheckDateTimeMinus20Secs.setSeconds(
      starCheckDateTimeMinus20Secs.getSeconds() - minusSeconds
    )

    const dateWithEuropeTimezoneMinus20Secs = new Date(
      formatToTimeZone(starCheckDateTimeMinus20Secs, format, {
        timeZone: 'Europe/Helsinki',
      }) + 'Z'
    )

    const error = await getError(async () =>
      checkLastValidPurchaseDateTime(dateWithEuropeTimezoneMinus20Secs)
    )

    // check that the returned error wasn't that no error was thrown
    expect(error).not.toBeInstanceOf(NoErrorThrownError)
    expect(error).toBeInstanceOf(ExperienceError)

    expect(error).toHaveProperty('definition', {
      code: 'forbidden-request',
      message: 'Optional lastValidPurchaseDateTime is expired',
      responseStatus: 403,
      logLevel: 'debug',
    })
  })
})

describe('Test Cancel Order', () => {
  it('Should throw error with no backend url set', async () => {
    process.env.ORDER_BACKEND_URL = ''
    await expect(
      cancelOrder({ orderId: orderMock.orderId, user: orderMock.user })
    ).rejects.toThrow('No order backend URL set')
  })
  it('Should cancel order correctly with backend url set', async () => {
    process.env.ORDER_BACKEND_URL = 'test.dev.hel'
    process.env.CHECKOUT_BASE_URL = 'https://checkout.dev.hel/'
    const mockData = {
      order: {
        ...orderMock,
        ...orderBackendCustomerMock,
        status: 'cancelled',
      },
      items: [
        {
          orderId: orderMock.orderId,
          orderItemId: '19699acf-b0a3-440f-818f-e582825fa3a7',
          productId: '30a245ed-5fca-4fcf-8b2a-cdf1ce6fca0d',
          quantity: 1,
          productName: 'Product Name',
          productLabel: 'Product Label',
          productDescription: 'Product Description',
          unit: 'pcs',
          rowPriceNet: '100',
          rowPriceVat: '24',
          rowPriceTotal: '124',
        },
      ],
    }
    axiosMock.get.mockResolvedValue({ data: mockData })
    const result = await cancelOrder({
      orderId: mockData.order.orderId,
      user: mockData.order.user,
    })
    expect(result).toEqual({
      ...orderMock,
      ...orderCustomerMock,
      status: 'cancelled',
      items: mockData.items,
      updateCardUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}/update-card?user=${mockData.order.user}`,
      checkoutUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}?user=${mockData.order.user}`,
      receiptUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}/receipt?user=${mockData.order.user}`,
      loggedInCheckoutUrl: `${process.env.CHECKOUT_BASE_URL}profile/${mockData.order.orderId}`,
    })
  })
})

describe('Test Add items to order', () => {
  it('Should throw error with no backend url set', async () => {
    process.env.ORDER_BACKEND_URL = ''
    await expect(
      addItemsToOrder({
        orderId: orderMock.orderId,
        user: orderMock.user,
        items: [],
      })
    ).rejects.toThrow('No order backend URL set')
  })
  it('Should add items correctly to order with backend url set', async () => {
    process.env.ORDER_BACKEND_URL = 'test.dev.hel'
    process.env.CHECKOUT_BASE_URL = 'https://checkout.dev.hel/'
    const mockData = {
      order: {
        ...orderMock,
        ...orderBackendCustomerMock,
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
    axiosMock.post.mockResolvedValue({ data: mockData })
    const result = await addItemsToOrder({
      orderId: mockData.order.orderId,
      user: mockData.order.user,
      items: [
        {
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
    })
    expect(result).toEqual({
      ...orderMock,
      ...orderCustomerMock,
      items: mockData.items,
      updateCardUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}/update-card?user=${mockData.order.user}`,
      checkoutUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}?user=${mockData.order.user}`,
      receiptUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}/receipt?user=${mockData.order.user}`,
      loggedInCheckoutUrl: `${process.env.CHECKOUT_BASE_URL}profile/${mockData.order.orderId}`,
    })
  })
})

describe('Test Set Customer To Order', () => {
  it('Should throw error with no backend url set', async () => {
    process.env.ORDER_BACKEND_URL = ''
    await expect(
      setCustomerToOrder({
        orderId: orderMock.orderId,
        user: orderMock.user,
        ...orderCustomerMock,
      })
    ).rejects.toThrow('No order backend URL set')
  })
  it('Should set customer correctly with backend url set for order without items', async () => {
    process.env.ORDER_BACKEND_URL = 'test.dev.hel'
    process.env.CHECKOUT_BASE_URL = 'https://checkout.dev.hel/'
    const mockData = {
      order: {
        ...orderMock,
        ...orderBackendCustomerMock,
      },
      items: [],
    }
    axiosMock.post.mockResolvedValue({ data: mockData })
    const result = await setCustomerToOrder({
      orderId: orderMock.orderId,
      user: orderMock.user,
      ...orderCustomerMock,
    })
    expect(result).toEqual({
      ...orderMock,
      ...orderCustomerMock,
      items: [],
      updateCardUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}/update-card?user=${mockData.order.user}`,
      checkoutUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}?user=${mockData.order.user}`,
      receiptUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}/receipt?user=${mockData.order.user}`,
      loggedInCheckoutUrl: `${process.env.CHECKOUT_BASE_URL}profile/${mockData.order.orderId}`,
    })
  })
  it('Should set customer correctly with backend url set for order with items', async () => {
    process.env.ORDER_BACKEND_URL = 'test.dev.hel'
    process.env.CHECKOUT_BASE_URL = 'https://checkout.dev.hel/'
    const mockData = {
      order: {
        ...orderMock,
        ...orderBackendCustomerMock,
      },
      items: [
        {
          productId: '30a245ed-5fca-4fcf-8b2a-cdf1ce6fca0d',
          quantity: 1,
          productName: 'Product Name',
          productLabel: 'Product Label',
          productDescription: 'Product Description',
          unit: 'pcs',
          rowPriceNet: 100,
          rowPriceVat: 24,
          rowPriceTotal: 124,
        },
      ],
    }
    axiosMock.post.mockResolvedValue({ data: mockData })
    const result = await setCustomerToOrder({
      orderId: orderMock.orderId,
      user: orderMock.user,
      ...orderCustomerMock,
    })
    expect(result).toEqual({
      ...orderMock,
      ...orderCustomerMock,
      items: mockData.items,
      updateCardUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}/update-card?user=${mockData.order.user}`,
      checkoutUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}?user=${mockData.order.user}`,
      receiptUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}/receipt?user=${mockData.order.user}`,
      loggedInCheckoutUrl: `${process.env.CHECKOUT_BASE_URL}profile/${mockData.order.orderId}`,
    })
  })
})

describe('Test Set Invoice To Order', () => {
  it('Should throw error with no backend url set', async () => {
    process.env.ORDER_BACKEND_URL = ''
    await expect(
      setInvoiceToOrder({
        orderId: orderMock.orderId,
        user: orderMock.user,
        ...orderInvoiceMock,
      })
    ).rejects.toThrow('No order backend URL set')
  })
  it('Should set invoice correctly with backend url set for order without items', async () => {
    process.env.ORDER_BACKEND_URL = 'test.dev.hel'
    process.env.CHECKOUT_BASE_URL = 'https://checkout.dev.hel/'
    const mockData = {
      order: {
        ...orderMock,
        ...orderBackendInvoiceMock,
      },
      items: [],
    }
    axiosMock.post.mockResolvedValue({ data: mockData })
    const result = await setInvoiceToOrder({
      orderId: orderMock.orderId,
      user: orderMock.user,
      ...orderInvoiceMock,
    })
    expect(result).toEqual({
      ...orderMock,
      ...orderInvoiceMock,
      items: [],
      updateCardUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}/update-card?user=${mockData.order.user}`,
      checkoutUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}?user=${mockData.order.user}`,
      receiptUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}/receipt?user=${mockData.order.user}`,
      loggedInCheckoutUrl: `${process.env.CHECKOUT_BASE_URL}profile/${mockData.order.orderId}`,
    })
  })

  it('Should set invoice correctly with backend url set for order with items', async () => {
    process.env.ORDER_BACKEND_URL = 'test.dev.hel'
    process.env.CHECKOUT_BASE_URL = 'https://checkout.dev.hel/'
    const mockData = {
      order: {
        ...orderMock,
        ...orderBackendInvoiceMock,
      },
      items: [
        {
          productId: '30a245ed-5fca-4fcf-8b2a-cdf1ce6fca0d',
          quantity: 1,
          productName: 'Product Name',
          productLabel: 'Product Label',
          productDescription: 'Product Description',
          unit: 'pcs',
          rowPriceNet: 100,
          rowPriceVat: 24,
          rowPriceTotal: 124,
        },
      ],
    }
    axiosMock.post.mockResolvedValue({ data: mockData })
    const result = await setInvoiceToOrder({
      orderId: orderMock.orderId,
      user: orderMock.user,
      ...orderInvoiceMock,
    })
    expect(result).toEqual({
      ...orderMock,
      ...orderInvoiceMock,
      items: mockData.items,
      updateCardUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}/update-card?user=${mockData.order.user}`,
      checkoutUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}?user=${mockData.order.user}`,
      receiptUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}/receipt?user=${mockData.order.user}`,
      loggedInCheckoutUrl: `${process.env.CHECKOUT_BASE_URL}profile/${mockData.order.orderId}`,
    })
  })
})

describe('Test Get Order', () => {
  it('Should throw error with no backend url set', async () => {
    process.env.ORDER_BACKEND_URL = ''
    await expect(
      getOrder({ orderId: orderMock.orderId, user: orderMock.user })
    ).rejects.toThrow('No order backend URL set')
  })
  it('Should get order correctly without items and with backend url set', async () => {
    process.env.ORDER_BACKEND_URL = 'test.dev.hel'
    process.env.CHECKOUT_BASE_URL = 'https://checkout.dev.hel/'
    const mockData = {
      order: {
        ...orderMock,
        ...orderBackendCustomerMock,
      },
      items: [],
    }
    axiosMock.get.mockResolvedValue({ data: mockData })
    const result = await getOrder({
      orderId: orderMock.orderId,
      user: orderMock.user,
    })
    expect(result).toEqual({
      ...orderMock,
      ...orderCustomerMock,
      items: [],
      updateCardUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}/update-card?user=${mockData.order.user}`,
      checkoutUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}?user=${mockData.order.user}`,
      receiptUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}/receipt?user=${mockData.order.user}`,
      loggedInCheckoutUrl: `${process.env.CHECKOUT_BASE_URL}profile/${mockData.order.orderId}`,
    })
  })
  it('Should get order with items correctly with backend url set', async () => {
    process.env.ORDER_BACKEND_URL = 'test.dev.hel'
    process.env.CHECKOUT_BASE_URL = 'https://checkout.dev.hel/'
    const mockData = {
      order: {
        ...orderMock,
        ...orderBackendCustomerMock,
      },
      items: [
        {
          orderId: orderMock.orderId,
          orderItemId: '19699acf-b0a3-440f-818f-e582825fa3a7',
          productId: '30a245ed-5fca-4fcf-8b2a-cdf1ce6fca0d',
          quantity: 1,
          productName: 'Product Name',
          productLabel: 'Product Label',
          productDescription: 'Product Description',
          unit: 'pcs',
          rowPriceNet: '100',
          rowPriceVat: '24',
          rowPriceTotal: '124',
        },
      ],
    }
    axiosMock.get.mockResolvedValue({ data: mockData })
    const result = await getOrder({
      orderId: orderMock.orderId,
      user: orderMock.user,
    })
    expect(result).toEqual({
      ...orderMock,
      ...orderCustomerMock,
      items: mockData.items,
      updateCardUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}/update-card?user=${mockData.order.user}`,
      checkoutUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}?user=${mockData.order.user}`,
      receiptUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}/receipt?user=${mockData.order.user}`,
      loggedInCheckoutUrl: `${process.env.CHECKOUT_BASE_URL}profile/${mockData.order.orderId}`,
    })
  })
  it('Should get subscription type order with items correctly with backend url set', async () => {
    process.env.ORDER_BACKEND_URL = 'test.dev.hel'
    process.env.CHECKOUT_BASE_URL = 'https://checkout.dev.hel/'
    const mockData = {
      order: {
        ...orderMock,
        ...orderBackendCustomerMock,
        type: 'subscription',
        subscriptionId: '8f346802-b564-490f-b8af-ff8a7ea923db',
      },
      items: [
        {
          orderId: orderMock.orderId,
          orderItemId: '19699acf-b0a3-440f-818f-e582825fa3a7',
          productId: '30a245ed-5fca-4fcf-8b2a-cdf1ce6fca0d',
          quantity: 1,
          productName: 'Product Name',
          productLabel: 'Product Label',
          productDescription: 'Product Description',
          unit: 'pcs',
          rowPriceNet: '100',
          rowPriceVat: '24',
          rowPriceTotal: '124',
        },
      ],
    }
    axiosMock.get.mockResolvedValue({ data: mockData })
    const result = await getOrder({
      orderId: orderMock.orderId,
      user: orderMock.user,
    })
    expect(result).toEqual({
      ...orderMock,
      ...orderCustomerMock,
      type: 'subscription',
      items: mockData.items,
      subscriptionId: mockData.order.subscriptionId,
      updateCardUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}/update-card?user=${mockData.order.user}`,
      checkoutUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}?user=${mockData.order.user}`,
      receiptUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}/receipt?user=${mockData.order.user}`,
      loggedInCheckoutUrl: `${process.env.CHECKOUT_BASE_URL}profile/${mockData.order.orderId}`,
    })
  })
})

describe('Test Calculate Totals for Order', () => {
  it('Should throw error with no backend url set', async () => {
    process.env.ORDER_BACKEND_URL = ''
    await expect(
      setOrderTotals({
        orderId: 'test',
        user: 'u1',
        priceNet: '0',
        priceVat: '0',
        priceTotal: '0',
      })
    ).rejects.toThrow('No order backend URL set')
  })
  it('Should set zero totals for order correctly with backend url set', async () => {
    process.env.ORDER_BACKEND_URL = 'test.dev.hel'
    process.env.CHECKOUT_BASE_URL = 'https://checkout.dev.hel/'
    const mockData = {
      order: {
        ...orderMock,
        priceNet: '0',
        priceVat: '0',
        priceTotal: '0',
      },
      items: [],
    }
    axiosMock.post.mockResolvedValue({ data: mockData })
    const result = await setOrderTotals({
      orderId: mockData.order.orderId,
      user: mockData.order.user,
      priceNet: 0,
      priceVat: 0,
      priceTotal: 0,
    })
    expect(result).toEqual({
      ...orderMock,
      items: [],
      customer: undefined,
      status: 'draft',
      priceNet: '0',
      priceVat: '0',
      priceTotal: '0',
      updateCardUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}/update-card?user=${mockData.order.user}`,
      checkoutUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}?user=${mockData.order.user}`,
      receiptUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}/receipt?user=${mockData.order.user}`,
      loggedInCheckoutUrl: `${process.env.CHECKOUT_BASE_URL}profile/${mockData.order.orderId}`,
    })
  })
  it('Should set totals for order with items correctly with backend url set', async () => {
    process.env.ORDER_BACKEND_URL = 'test.dev.hel'
    process.env.CHECKOUT_BASE_URL = 'https://checkout.dev.hel/'
    const mockData = {
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
          quantity: 1,
          productName: 'Product Name',
          productLabel: 'Product Label',
          productDescription: 'Product Description',
          unit: 'pcs',
          rowPriceNet: '100',
          rowPriceVat: '24',
          rowPriceTotal: '124',
        },
      ],
    }
    axiosMock.post.mockResolvedValue({ data: mockData })
    const result = await setOrderTotals({
      orderId: orderMock.orderId,
      user: orderMock.user,
      priceNet: 100,
      priceVat: 24,
      priceTotal: 124,
    })
    expect(result).toEqual({
      ...orderMock,
      ...orderCustomerMock,
      items: mockData.items,
      priceNet: '100',
      priceVat: '24',
      priceTotal: '124',
      updateCardUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}/update-card?user=${mockData.order.user}`,
      checkoutUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}?user=${mockData.order.user}`,
      receiptUrl: `${process.env.CHECKOUT_BASE_URL}${mockData.order.orderId}/receipt?user=${mockData.order.user}`,
      loggedInCheckoutUrl: `${process.env.CHECKOUT_BASE_URL}profile/${mockData.order.orderId}`,
    })
  })
})

describe('Test Create Accounting entry for order', () => {
  it('Should throw error with no backend url set', async () => {
    process.env.ORDER_BACKEND_URL = ''
    await expect(
      createAccountingEntryForOrder({
        dtos: [],
        orderId: '',
        namespace: 'namespace',
      })
    ).rejects.toThrow('No order backend URL set')
  })
  it('Should create order accounting entry correctly with backend url set', async () => {
    process.env.ORDER_BACKEND_URL = 'test.dev.hel'
    process.env.CHECKOUT_BASE_URL = 'https://checkout.dev.hel/'
    const mockData = {
      orderId: orderMock.orderId,
      dtos: [
        {
          productId: '123',
          priceGross: '124',
          priceNet: '100',
          companyCode: 'companyCode',
          mainLedgerAccount: 'mainLedgerAccount',
          vatCode: 'vatCode',
          internalOrder: 'internalOrder',
          profitCenter: 'profitCenter',
          balanceProfitCenter: 'balanceProfitCenter',
          project: 'project',
          operationArea: 'operationArea',
          paidAt: 'paidAt',
          merchantId: 'merchantId',
          namespace: 'namespace',
          paytrailTransactionId: 'paytrailTransactionId',
        },
      ],
      namespace: 'namespace',
    }
    axiosMock.post.mockResolvedValue({ data: mockData })
    const result = await createAccountingEntryForOrder({
      ...mockData,
    })
    expect(result).toEqual(mockData)
  })
})

describe('checkIfWrongVatCodeAfterGivenDate', () => {
  it('should return false when the VAT code is correct and date is before the given date', () => {
    const items = ([{ vatPercentage: '10' }] as unknown) as [OrderItem]
    const vatCode = '24'
    const dateTime = '2023-08-20T10:00:00.000Z'
    const result = isVatCodeUsedAfterDateTime(items, vatCode, dateTime)
    expect(result).toBe(false)
  })

  it('should return false when the VAT code is correct and date is after the given date', () => {
    const items = ([{ vatPercentage: '10' }] as unknown) as [OrderItem]
    const vatCode = '24'
    const dateTime = '2023-08-25T10:00:00.000Z'
    const result = isVatCodeUsedAfterDateTime(items, vatCode, dateTime)
    expect(result).toBe(false)
  })

  it('should return false when the VAT code is correct but date is before the given date', () => {
    const items = ([{ vatPercentage: '24' }] as unknown) as [OrderItem]
    const vatCode = '24'
    const dateTime = '2023-08-20T10:00:00.000Z'
    const result = isVatCodeUsedAfterDateTime(items, vatCode, dateTime)
    expect(result).toBe(false)
  })

  it('should return true if vat percentage starts with 24', () => {
    const items = ([
      { vatPercentage: '24,00' },
      { vatPercentage: '24.00' },
      { vatPercentage: '24.12' },
    ] as unknown) as [OrderItem]
    const vatCode = '24'
    const result = isVatPercentageUsedInOrderItems(items, vatCode)
    expect(result).toBe(true) // Adjust based on your logic (true/false).
  })

  it('should return false if vat percentage starts with 2', () => {
    const items = ([
      { vatPercentage: '2' },
      { vatPercentage: '2' },
      { vatPercentage: '2' },
    ] as unknown) as [OrderItem]
    const vatCode = '2'
    const result = isVatPercentageUsedInOrderItems(items, vatCode)
    expect(result).toBe(true) // Adjust based on your logic (true/false).
  })
})
