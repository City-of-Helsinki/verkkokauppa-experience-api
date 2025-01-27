import { GetProductAccountingByNamespaceAdminController } from './getProductAccountingByNamespaceAdminController'
import type { ValidatedRequest } from '@verkkokauppa/core'
import type { Response as MockedResponse } from 'express'
import { logger } from '@verkkokauppa/core'

jest.mock('@verkkokauppa/product-backend', () => ({
  getProductAccountingBatch: jest.fn(),
  getProductInvoicings: jest.fn(),
}))

jest.mock('@verkkokauppa/product-mapping-backend', () => ({
  getProductMappingsByNamespace: jest.fn(),
}))

jest.mock('@verkkokauppa/configuration-backend', () => ({
  validateAdminApiKey: jest.fn(),
}))

const {
  getProductAccountingBatch,
  getProductInvoicings,
} = require('@verkkokauppa/product-backend')

const {
  getProductMappingsByNamespace,
} = require('@verkkokauppa/product-mapping-backend')
const { validateAdminApiKey } = require('@verkkokauppa/configuration-backend')

// Set up the mock implementations
getProductAccountingBatch.mockImplementation(() => [
  {
    productId: 'test-product-id',
    accountingDetails: 'some-accounting-data',
  },
])

getProductInvoicings.mockImplementation(() => [
  {
    productId: 'test-product-id',
    invoiceId: 'test-invoice-id',
    amount: 100,
  },
])

getProductMappingsByNamespace.mockImplementation(() => [
  {
    productId: 'test-product-id',
    mappingDetails: 'some-mapping-data',
  },
])

jest.mock('@verkkokauppa/core', () => {
  const originalModule = jest.requireActual('@verkkokauppa/core')

  return {
    ...originalModule,
    logger: {
      info: jest.fn(),
      debug: jest.fn(),
    },
  }
})

describe('GetProductAccountingByNamespaceAdminController', () => {
  let controller: GetProductAccountingByNamespaceAdminController
  let mockRequest: any
  let mockResponse: any

  beforeEach(() => {
    controller = new GetProductAccountingByNamespaceAdminController()

    mockRequest = {
      params: {
        namespace: 'test-namespace',
      },
      headers: {
        'api-key': 'test-api-key',
      },
      get: jest.fn((header: string) => {
        if (header === 'api-key') {
          return 'test-api-key'
        }
        return null
      }),
    }

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      get: jest.fn((header: string) => {
        if (header === 'api-key') {
          return 'test-api-key'
        }
        return null
      }),
    }

    jest.clearAllMocks()
  })

  it('should return product accounting and invoicing successfully with status 200', async () => {
    await controller.execute(
      mockRequest as ValidatedRequest<any>,
      mockResponse as MockedResponse
    )

    expect(validateAdminApiKey).toHaveBeenCalledWith({
      apiKey: 'test-api-key',
    })

    expect(getProductMappingsByNamespace).toHaveBeenCalledWith({
      namespace: 'test-namespace',
    })
    expect(getProductAccountingBatch).toHaveBeenCalledWith({
      productIds: ['test-product-id'],
    })
    expect(getProductInvoicings).toHaveBeenCalledWith({
      productIds: ['test-product-id'],
    })

    expect(mockResponse.status).toHaveBeenCalledWith(200)
    expect(mockResponse.json.mock.calls[0][0]).toEqual([
      {
        productMapping: {
          productId: 'test-product-id',
          mappingDetails: 'some-mapping-data',
        },
        accounting: {
          productId: 'test-product-id',
          accountingDetails: 'some-accounting-data',
        },
        productInvoicing: {
          productId: 'test-product-id',
          invoiceId: 'test-invoice-id',
          amount: 100,
        },
      },
    ])
  })

  it('should handle invoicing error gracefully and return status 200', async () => {
    getProductInvoicings.mockImplementationOnce(() => {
      throw new Error('Invoicing error')
    })

    await controller.execute(
      mockRequest as ValidatedRequest<any>,
      mockResponse as MockedResponse
    )

    expect(validateAdminApiKey).toHaveBeenCalledWith({
      apiKey: 'test-api-key',
    })

    expect(getProductMappingsByNamespace).toHaveBeenCalledWith({
      namespace: 'test-namespace',
    })
    expect(getProductAccountingBatch).toHaveBeenCalledWith({
      productIds: ['test-product-id'],
    })
    expect(getProductInvoicings).toHaveBeenCalledWith({
      productIds: ['test-product-id'],
    })

    const calls = (logger.debug as jest.Mock).mock.calls
    expect(calls[0][0]).toEqual(
      'Admin - Get product accounting for namespace: test-namespace'
    )
    expect(calls[1][0]).toEqual(
      'Admin - Get invoicingAccounting for products id: test-product-id returned an error'
    )

    expect(mockResponse.status).toHaveBeenCalledWith(200)
    expect(mockResponse.json).toHaveBeenCalledWith([
      {
        productMapping: {
          productId: 'test-product-id',
          mappingDetails: 'some-mapping-data',
        },
        accounting: {
          productId: 'test-product-id',
          accountingDetails: 'some-accounting-data',
        },
        productInvoicing: {}, // Empty object due to error in invoicing
      },
    ])
  })
})
