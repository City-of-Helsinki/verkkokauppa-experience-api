import { AbstractController, ValidatedRequest } from '@verkkokauppa/core'
import type { Response } from 'express'
import { GetController } from './getController'
import { CancelSubscription } from './cancelSubscription'

jest.mock('@verkkokauppa/order-backend')

const cancelSubscriptionMock = require('@verkkokauppa/order-backend').cancelSubscription.mockImplementation(
  () => ({})
)

const subscriptionMock = {}

beforeEach(() => {
  jest.clearAllMocks()
})

const cancelSubscription = new (class extends CancelSubscription {
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
  params: { subscriptionId: 'test123' },
  body: requestBody,
  headers: requestHeaders,
} as any

describe('Test cancelSubscription', () => {
  it('Should cancel subscription', async () => {
    const successSpy = jest.spyOn(AbstractController.prototype, 'success')
    cancelSubscriptionMock.mockImplementationOnce(() => subscriptionMock)
    const res = await cancelSubscription.implementation(
      mockRequest,
      mockResponse
    )
    expect(successSpy).toHaveBeenCalledTimes(1)
    expect(successSpy.mock.calls[0]?.[0]).toBe(mockResponse)
    expect(successSpy.mock.calls[0]?.[1]).toMatchObject({
      ...subscriptionMock,
    })
    expect(res).toBe(successSpy.mock.results[0]?.value)
  })
})
