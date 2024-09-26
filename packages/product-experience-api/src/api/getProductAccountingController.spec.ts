import { GetProductAccountingController } from './getProductAccountingController'
import type { ValidatedRequest } from '@verkkokauppa/core'
import type { Response as MockedResponse } from 'express'
import { logger } from '@verkkokauppa/core'

jest.mock('@verkkokauppa/product-backend', () => ({
  getProductAccountingBatch: jest.fn(),
  getProductInvoicings: jest.fn(),
}))

jest.mock('@verkkokauppa/configuration-backend', () => ({
  validateApiKey: jest.fn(),
}))

const {
  getProductAccountingBatch,
  getProductInvoicings,
} = require('@verkkokauppa/product-backend')

// Now set up the mock implementations
getProductAccountingBatch.mockImplementation(() => [
  {
    productId: 'test-product-id',
    accountingDetails: 'some-accounting-data',
  },
])

getProductInvoicings.mockImplementation(() => [
  {
    invoiceId: 'test-invoice-id',
    amount: 100,
  },
])

jest.mock('@verkkokauppa/core', () => {
  const originalModule = jest.requireActual('@verkkokauppa/core')

  return {
    ...originalModule, // Spread the original module to keep the original functionality
    logger: {
      info: jest.fn(),
      debug: jest.fn(),
    },
  }
})
describe('GetProductAccountingController', () => {
  let controller: GetProductAccountingController
  let mockRequest: any
  let mockResponse: any

  beforeEach(() => {
    controller = new GetProductAccountingController()

    mockRequest = {
      params: { productId: '' },
      headers: {
        'api-key': '',
        namespace: '',
      },
      // Mock the get method for req.get(header)
      get: jest.fn((header: string) => {
        if (header === 'api-key') {
          return 'mockApiKey'
        }
        if (header === 'namespace') {
          return 'mockNamespace'
        }
        return null
      }),
    }

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      get: jest.fn((header: string) => {
        if (header === 'Content-Type') {
          return 'application/json'
        }
        return null
      }),
    }
    jest.clearAllMocks()
  })

  it('should return product accounting and invoicing successfully', async () => {
    const productId = 'test-product-id'
    const apiKey = 'test-api-key'
    const namespace = 'test-namespace'

    mockRequest.params = { productId }
    mockRequest.headers = { 'api-key': apiKey, namespace }

    await controller.execute(
      mockRequest as ValidatedRequest<any>,
      mockResponse as MockedResponse
    )

    expect(getProductAccountingBatch).toHaveBeenCalledWith({
      productIds: [productId],
    })
    expect(getProductInvoicings).toHaveBeenCalledWith({
      productIds: [productId],
    })

    expect(mockResponse.status).toHaveBeenCalledWith(201)
    expect(mockResponse.json.mock.calls[0][0]).toEqual({
      productId: productId,
      accountingDetails: 'some-accounting-data',
      productInvoicing: {
        productId,
        invoiceId: 'test-invoice-id',
        amount: 100,
      },
    })
  })

  it('should handle invoicing error gracefully', async () => {
    const productId = 'test-product-id'
    const apiKey = 'test-api-key'
    const namespace = 'test-namespace'

    mockRequest.params = { productId }
    mockRequest.headers = { 'api-key': apiKey, namespace }

    getProductInvoicings.mockImplementationOnce(() => {
      throw new Error('Invoicing error')
    })

    await controller.execute(
      mockRequest as ValidatedRequest<any>,
      mockResponse as MockedResponse
    )

    expect(getProductAccountingBatch).toHaveBeenCalledWith({
      productIds: [productId],
    })
    expect(getProductInvoicings).toHaveBeenCalledWith({
      productIds: [productId],
    })

    // Ensure logger was called
    const calls = (logger.debug as jest.Mock).mock.calls
    // console.log(JSON.stringify(calls, null, 4))
    // console.log(JSON.stringify(calls[0], null, 4))
    // console.log(JSON.stringify(calls[1], null, 4))
    expect(calls[0][0]).toEqual(
      `Get product accounting for product id: ${productId}`
    )
    // Ensure logger was called
    expect(calls[1][0]).toEqual(
      `Get invoicingAccounting for product id: ${productId} returned an error`
    )

    expect(mockResponse.status).toHaveBeenCalledWith(201)
    expect(mockResponse.json).toHaveBeenCalledWith({
      productId: productId,
      accountingDetails: 'some-accounting-data',
    })
  })
})
