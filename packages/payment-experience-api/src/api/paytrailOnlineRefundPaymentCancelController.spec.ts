import type { Request, Response } from 'express'
import { PaytrailOnlineRefundPaymentCancelController } from './paytrailOnlineRefundPaymentCancelController'
import { AbstractController } from '@verkkokauppa/core'

jest.mock('@verkkokauppa/payment-backend')
jest.mock('@verkkokauppa/message-backend')
jest.mock('@verkkokauppa/order-backend')

const refundId = 'rid1'
const orderId = 'oid1'
const merchantId = 'mid1'

const getOrderAdminMock = require('@verkkokauppa/order-backend').getOrderAdmin.mockImplementation(
  () => ({
    orderId,
    items: [
      {
        merchantId,
      },
    ],
  })
)

const getRefundAdminMock = require('@verkkokauppa/order-backend').getRefundAdmin.mockImplementation(
  () => ({
    refund: {
      orderId,
    },
  })
)

const checkPaytrailRefundCallbackUrlMock = require('@verkkokauppa/payment-backend').checkPaytrailRefundCallbackUrl.mockImplementation(
  () => ({
    valid: true,
  })
)

const sendErrorNotificationMock = require('@verkkokauppa/message-backend').sendErrorNotification.mockImplementation(
  () => undefined
)

const mockResponse = ({
  status: () => ({ json: () => ({}) }),
} as any) as Response

const controller = new (class extends PaytrailOnlineRefundPaymentCancelController {
  implementation(req: Request, res: Response): Promise<any> {
    return super.implementation(req as any, res)
  }
})()

const query = {
  'checkout-stamp': refundId,
  signature: '123abc',
}

const successSpy = jest.spyOn(AbstractController.prototype, 'success')

beforeEach(() => {
  jest.clearAllMocks()
})

describe('Test paytrail refund payment cancel controller', () => {
  const expects = (
    callGetOrderAdmin: boolean,
    callGetRefundAdmin: boolean,
    callCheckUrl: boolean,
    callSendError: boolean
  ) => {
    if (callGetRefundAdmin) {
      expect(getRefundAdminMock).toHaveBeenCalledTimes(1)
      expect(getRefundAdminMock.mock.calls[0][0]).toEqual({ refundId })
    } else {
      expect(getRefundAdminMock).toHaveBeenCalledTimes(0)
    }

    if (callGetOrderAdmin) {
      expect(getOrderAdminMock).toHaveBeenCalledTimes(1)
      expect(getOrderAdminMock.mock.calls[0][0]).toEqual({ orderId })
    } else {
      expect(getOrderAdminMock).toHaveBeenCalledTimes(0)
    }

    if (callCheckUrl) {
      expect(checkPaytrailRefundCallbackUrlMock).toHaveBeenCalledTimes(1)
      expect(checkPaytrailRefundCallbackUrlMock.mock.calls[0][0]).toEqual({
        merchantId,
        params: query,
      })
    } else {
      expect(checkPaytrailRefundCallbackUrlMock).toHaveBeenCalledTimes(0)
    }

    if (callSendError) {
      expect(sendErrorNotificationMock).toHaveBeenCalledTimes(1)
      expect(sendErrorNotificationMock.mock.calls[0][0]).toEqual({
        message: JSON.stringify({
          request: { query },
          refundId,
          orderId,
          refundPaymentStatus: { valid: true },
        }),
        cause: 'Paytrail refund payment cancel controller called',
      })
    } else {
      expect(sendErrorNotificationMock).toHaveBeenCalledTimes(0)
    }

    expect(successSpy).toHaveBeenCalledTimes(1)
    expect(successSpy.mock.calls[0]?.length).toEqual(1)
    expect(successSpy.mock.calls[0]?.[0]).toBe(mockResponse)
  }

  // eslint-disable-next-line jest/expect-expect
  it('Returns success if refund id is missing', async () => {
    await controller.implementation({ query: {} } as any, mockResponse)
    expects(false, false, false, false)
  })
  // eslint-disable-next-line jest/expect-expect
  it('Returns success if get refund admin throws', async () => {
    getRefundAdminMock.mockImplementationOnce(() => {
      throw new Error()
    })
    await controller.implementation({ query } as any, mockResponse)
    expects(false, true, false, false)
  })
  // eslint-disable-next-line jest/expect-expect
  it('Returns success if get order admin throws', async () => {
    getOrderAdminMock.mockImplementationOnce(() => {
      throw new Error()
    })
    await controller.implementation({ query } as any, mockResponse)
    expects(true, true, false, false)
  })
  // eslint-disable-next-line jest/expect-expect
  it('Returns success if check paytrail return url fails', async () => {
    checkPaytrailRefundCallbackUrlMock.mockImplementationOnce(() => {
      throw new Error()
    })
    await controller.implementation({ query } as any, mockResponse)
    expects(true, true, true, false)
  })
  // eslint-disable-next-line jest/expect-expect
  it('Returns success if check paytrail return url status is invalid', async () => {
    checkPaytrailRefundCallbackUrlMock.mockImplementationOnce(() => ({
      valid: false,
    }))
    await controller.implementation({ query } as any, mockResponse)
    expects(true, true, true, false)
  })
  // eslint-disable-next-line jest/expect-expect
  it('Returns success if send error notification fails', async () => {
    sendErrorNotificationMock.mockImplementationOnce(() => {
      throw new Error()
    })
    await controller.implementation({ query } as any, mockResponse)
    expects(true, true, true, true)
  })
  // eslint-disable-next-line jest/expect-expect
  it('Sends error notification and returns success', async () => {
    await controller.implementation({ query } as any, mockResponse)
    expects(true, true, true, true)
  })
})
