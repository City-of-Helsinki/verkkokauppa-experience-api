import { PaytrailCardUpdateRedirectCancelController } from './paytrailCardUpdateRedirectCancelController'
import type { Request, Response } from 'express'
import { URL } from 'url'
import { logger } from '@verkkokauppa/core'

jest.mock('@verkkokauppa/order-backend', () => ({
  getOrderAdmin: jest.fn(),
}))

jest.mock('@verkkokauppa/core', () => {
  const actual = jest.requireActual('@verkkokauppa/core')
  return {
    ...actual,
    logger: {
      info: jest.fn(),
      error: jest.fn(),
    },
  }
})

jest.mock('@verkkokauppa/payment-backend', () => ({
  checkPaytrailCardUpdateReturnUrl: jest.fn(),
}))

describe('PaytrailCardUpdateRedirectCancelController', () => {
  const globalRedirectUrl = 'https://example.com/redirect'
  let req: Partial<Request>
  let res: Partial<Response>

  beforeEach(() => {
    process.env.REDIRECT_PAYTRAIL_PAYMENT_URL_BASE = globalRedirectUrl
    req = {
      params: {},
    } as Partial<Request>
    res = {
      redirect: jest.fn(),
    } as Partial<Response>
  })

  afterEach(() => {
    jest.clearAllMocks()
    delete process.env.REDIRECT_PAYTRAIL_PAYMENT_URL_BASE
  })

  describe('redirect method', () => {
    it('should append pathname and user to the URL', () => {
      const url = new URL(globalRedirectUrl)
      const result = PaytrailCardUpdateRedirectCancelController.redirect(
        url,
        '123',
        'user1'
      )

      expect(result.pathname).toBe('/123/card-update-failed')
      expect(result.searchParams.get('user')).toBe('user1')
    })

    it('should handle missing orderId and user', () => {
      const url = new URL(globalRedirectUrl)
      const result = PaytrailCardUpdateRedirectCancelController.redirect(url)

      expect(result.pathname).toBe('/card-update-failed')
      expect(result.searchParams.get('user')).toBeNull()
    })
  })

  describe('implementation method', () => {
    const getOrderAdminMock = require('@verkkokauppa/order-backend')
      .getOrderAdmin

    const controller = new (class extends PaytrailCardUpdateRedirectCancelController {
      implementation(req: Request, res: Response): Promise<any> {
        return super.implementation(req, res)
      }
    })()

    it('should throw an error if base redirect URL is missing', async () => {
      delete process.env.REDIRECT_PAYTRAIL_PAYMENT_URL_BASE

      await expect(
        controller.implementation(req as Request, res as Response)
      ).rejects.toThrow('No default paytrail redirect url defined')
    })

    it('should redirect to default failed URL if orderId is missing', async () => {
      await controller.implementation(req as Request, res as Response)

      expect(res.redirect).toHaveBeenCalledWith(
        302,
        new URL('/card-update-failed', globalRedirectUrl).toString()
      )
    })

    it('should redirect to specific failed URL if orderId is present', async () => {
      req.params = { orderId: '123' }

      getOrderAdminMock.mockResolvedValueOnce({})

      await controller.implementation(req as Request, res as Response)

      expect(getOrderAdminMock).toHaveBeenCalledWith({ orderId: '123' })
      expect(res.redirect).toHaveBeenCalledWith(
        302,
        new URL('/123/card-update-failed', globalRedirectUrl).toString()
      )
    })

    it('should handle errors and redirect to default failed URL', async () => {
      req.params = { orderId: '123' }

      getOrderAdminMock.mockRejectedValueOnce(new Error('Order not found'))

      await controller.implementation(req as Request, res as Response)

      expect(logger.error).toHaveBeenCalledWith(new Error('Order not found'))
      expect(res.redirect).toHaveBeenCalledWith(
        302,
        new URL(
          `${req.params.orderId}/card-update-failed`,
          globalRedirectUrl
        ).toString()
      )
    })
  })
})
