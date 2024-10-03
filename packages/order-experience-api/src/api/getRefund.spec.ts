import axios from 'axios'
import { GetRefundController } from './getRefund' // Assuming your controller is here
import { validateApiKey } from '@verkkokauppa/configuration-backend'
import { getOrderAdmin, getRefundAdmin } from '@verkkokauppa/order-backend'
import { getRefundPaymentForOrderAdminByRefundId } from '@verkkokauppa/payment-backend'

// Mock the external dependencies
jest.mock('axios')
jest.mock('@verkkokauppa/configuration-backend', () => ({
  validateApiKey: jest.fn(),
}))
jest.mock('@verkkokauppa/order-backend', () => ({
  getRefundAdmin: jest.fn(),
  getOrderAdmin: jest.fn(),
}))
jest.mock('@verkkokauppa/payment-backend', () => ({
  getRefundPaymentForOrderAdminByRefundId: jest.fn(),
}))

// Axios mock instance
// @ts-ignore
const axiosMock = axios as jest.Mocked<typeof axios>

describe('GetRefundController Tests', () => {
  let controller: GetRefundController
  let mockRequest: any
  let mockResponse: any

  beforeEach(() => {
    controller = new GetRefundController()

    // Mock request and response objects
    mockRequest = {
      params: {
        refundId: 'mockRefundId',
      },
      headers: {
        'api-key': 'mockApiKey',
        namespace: 'mockNamespace',
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
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
      // Mock the get method for res.get(header)
      get: jest.fn((header: string) => {
        if (header === 'Content-Type') {
          return 'application/json'
        }
        return null
      }),
    }

    jest.clearAllMocks()
  })

  it('should return refund details with payment information successfully', async () => {
    // Mock the API key validation
    ;(validateApiKey as jest.Mock).mockResolvedValue(undefined)

    // Mocking the refund and order admin API calls
    const mockRefund = {
      refund: { refundId: 'mockRefundId', orderId: 'mockOrderId' },
    }
    const mockOrder = { orderId: 'mockOrderId' }
    const mockRefundPayment = { paymentId: 'mockPaymentId' }

    ;(getRefundAdmin as jest.Mock).mockResolvedValue(mockRefund)
    ;(getOrderAdmin as jest.Mock).mockResolvedValue(mockOrder)
    ;(getRefundPaymentForOrderAdminByRefundId as jest.Mock).mockResolvedValue([
      mockRefundPayment,
    ])

    // Execute the controller method
    await controller.execute(mockRequest, mockResponse)

    // Check that the necessary functions were called with the correct parameters
    expect(validateApiKey).toHaveBeenCalledWith({
      namespace: 'mockNamespace',
      apiKey: 'mockApiKey',
    })
    expect(getRefundAdmin).toHaveBeenCalledWith({ refundId: 'mockRefundId' })
    expect(getOrderAdmin).toHaveBeenCalledWith({ orderId: 'mockOrderId' })
    expect(getRefundPaymentForOrderAdminByRefundId).toHaveBeenCalledWith({
      refundId: 'mockRefundId',
    })

    // Verify the response
    expect(mockResponse.status).toHaveBeenCalledWith(200)
    expect(mockResponse.json).toHaveBeenCalledWith({
      refund: { refundId: 'mockRefundId', orderId: 'mockOrderId' },
      payment: [mockRefundPayment],
    })
  })

  it('should return refund details without payment information when payment is missing', async () => {
    // Mock the API key validation
    ;(validateApiKey as jest.Mock).mockResolvedValue(undefined)

    // Mocking the refund and order admin API calls
    const mockRefund = {
      refund: { refundId: 'mockRefundId', orderId: 'mockOrderId' },
    }
    const mockOrder = { orderId: 'mockOrderId' }

    ;(getRefundAdmin as jest.Mock).mockResolvedValue(mockRefund)
    ;(getOrderAdmin as jest.Mock).mockResolvedValue(mockOrder)
    ;(getRefundPaymentForOrderAdminByRefundId as jest.Mock).mockRejectedValue(
      new Error('Refund payment not found')
    )

    // Execute the controller method
    await controller.execute(mockRequest, mockResponse)

    // Check that the necessary functions were called with the correct parameters
    expect(validateApiKey).toHaveBeenCalledWith({
      namespace: 'mockNamespace',
      apiKey: 'mockApiKey',
    })
    expect(getRefundAdmin).toHaveBeenCalledWith({ refundId: 'mockRefundId' })
    expect(getOrderAdmin).toHaveBeenCalledWith({ orderId: 'mockOrderId' })
    expect(getRefundPaymentForOrderAdminByRefundId).toHaveBeenCalledWith({
      refundId: 'mockRefundId',
    })

    // Verify the response (no payment info)
    expect(mockResponse.status).toHaveBeenCalledWith(200)
    expect(mockResponse.json).toHaveBeenCalledWith({
      refund: { refundId: 'mockRefundId', orderId: 'mockOrderId' },
      payment: null, // No payment info
    })
  })

  it('should handle validation errors properly', async () => {
    // Mock request without required headers
    mockRequest.headers = {}

    // Execute the controller method
    await controller.execute(mockRequest, mockResponse)

    // Verify the error response
    expect(mockResponse.status).toHaveBeenCalledWith(400)
    expect(mockResponse.json).toHaveBeenCalledWith({
      errors: [
        {
          code: 'request-validation-failed',
          message:
            'headers.api-key is a required field\nheaders.namespace is a required field',
        },
      ],
    })
  })
})
