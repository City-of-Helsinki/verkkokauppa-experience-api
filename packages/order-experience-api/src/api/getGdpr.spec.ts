import type { Response } from 'express'
import { GetGdprController } from './getGdpr'
import type { ValidatedRequest } from '@verkkokauppa/core'

jest.mock('@verkkokauppa/order-backend')

const getOrdersByUserAdminMock = require('@verkkokauppa/order-backend').getOrdersByUserAdmin.mockImplementation(
  () => []
)

const getSubscriptionsByUserAdminMock = require('@verkkokauppa/order-backend').getSubscriptionsByUserAdmin.mockImplementation(
  () => []
)

const controller = new (class extends GetGdprController {
  implementation(req: ValidatedRequest<any>, res: Response): Promise<any> {
    return super.implementation(req, res)
  }
})()

const mockJson = jest.fn()
const mockResponse = ({
  status: () => ({ json: mockJson }),
} as any) as Response

beforeEach(() => {
  jest.clearAllMocks()
})

describe('Test GetGdprController', () => {
  const mockRequest = {
    params: {
      id: 'uid1',
    },
    headers: {
      user: 'uid1',
    },
    query: {},
  }
  it('Should get orders', async () => {
    try {
      await controller.implementation(mockRequest, mockResponse)
      // eslint-disable-next-line no-empty
    } catch (e) {}
    expect(getOrdersByUserAdminMock).toHaveBeenCalledTimes(1)
    expect(getOrdersByUserAdminMock.mock.calls[0][0]).toEqual({
      user: 'uid1',
    })
  })
  it('Should get subscriptions', async () => {
    try {
      await controller.implementation(mockRequest, mockResponse)
      // eslint-disable-next-line no-empty
    } catch (e) {}
    expect(getSubscriptionsByUserAdminMock).toHaveBeenCalledTimes(1)
    expect(getSubscriptionsByUserAdminMock.mock.calls[0][0]).toEqual({
      user: 'uid1',
    })
  })
  it('Should formulate the tree correctly', async () => {
    getOrdersByUserAdminMock.mockImplementationOnce(() => [
      {
        orderId: 'oid1',
        items: [
          {
            orderItemId: 'oiid1',
            productId: 'pid1',
            productName: 'pn1',
          },
          {
            orderItemId: 'oiid2',
            productId: 'pid2',
            productName: 'pn2',
          },
        ],
        meta: [
          {
            orderItemMetaId: 'oimid1',
            key: 'k1',
            value: 'v1',
          },
          {
            orderItemMetaId: 'oimid2',
            key: 'k2',
            value: 'v2',
          },
        ],
        type: 'order',
      },
    ])
    getSubscriptionsByUserAdminMock.mockImplementationOnce(() => [
      {
        subscriptionId: 'sid1',
        meta: [
          {
            orderItemMetaId: 'oimid3',
            key: 'k3',
            value: 'v3',
          },
          {
            orderItemMetaId: 'oimid4',
            key: 'k4',
            value: 'v4',
          },
        ],
      },
    ])
    await controller.implementation(mockRequest, mockResponse)
    expect(mockJson.mock.calls[0][0]).toEqual({
      key: 'profile',
      children: [
        {
          key: 'subscriptions',
          children: [
            {
              key: 'subscription',
              children: [
                {
                  children: undefined,
                  key: 'subscriptionId',
                  value: 'sid1',
                },
                {
                  key: 'meta',
                  children: [
                    {
                      key: 'metaItem',
                      children: [
                        {
                          children: undefined,
                          key: 'orderItemMetaId',
                          value: 'oimid3',
                        },
                        {
                          children: undefined,
                          key: 'key',
                          value: 'k3',
                        },
                        {
                          children: undefined,
                          key: 'value',
                          value: 'v3',
                        },
                      ],
                    },
                    {
                      key: 'metaItem',
                      children: [
                        {
                          children: undefined,
                          key: 'orderItemMetaId',
                          value: 'oimid4',
                        },
                        {
                          children: undefined,
                          key: 'key',
                          value: 'k4',
                        },
                        {
                          children: undefined,
                          key: 'value',
                          value: 'v4',
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          key: 'orders',
          children: [
            {
              key: 'order',
              children: [
                {
                  children: undefined,
                  key: 'orderId',
                  value: 'oid1',
                },
                {
                  children: undefined,
                  key: 'type',
                  value: 'order',
                },
                {
                  key: 'items',
                  children: [
                    {
                      key: 'orderItem',
                      children: [
                        {
                          children: undefined,
                          key: 'orderItemId',
                          value: 'oiid1',
                        },
                        {
                          children: undefined,
                          key: 'productId',
                          value: 'pid1',
                        },
                        {
                          children: undefined,
                          key: 'productName',
                          value: 'pn1',
                        },
                      ],
                    },
                    {
                      key: 'orderItem',
                      children: [
                        {
                          children: undefined,
                          key: 'orderItemId',
                          value: 'oiid2',
                        },
                        {
                          children: undefined,
                          key: 'productId',
                          value: 'pid2',
                        },
                        {
                          children: undefined,
                          key: 'productName',
                          value: 'pn2',
                        },
                      ],
                    },
                  ],
                },
                {
                  key: 'meta',
                  children: [
                    {
                      key: 'metaItem',
                      children: [
                        {
                          children: undefined,
                          key: 'orderItemMetaId',
                          value: 'oimid1',
                        },
                        {
                          children: undefined,
                          key: 'key',
                          value: 'k1',
                        },
                        {
                          children: undefined,
                          key: 'value',
                          value: 'v1',
                        },
                      ],
                    },
                    {
                      key: 'metaItem',
                      children: [
                        {
                          children: undefined,
                          key: 'orderItemMetaId',
                          value: 'oimid2',
                        },
                        {
                          children: undefined,
                          key: 'key',
                          value: 'k2',
                        },
                        {
                          children: undefined,
                          key: 'value',
                          value: 'v2',
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    })
  })
  it('Should filter out empty nodes', async () => {
    getSubscriptionsByUserAdminMock.mockImplementationOnce(() => [
      {
        subscriptionId: 'sid1',
        orderId: null,
        meta: [],
      },
    ])
    await controller.implementation(mockRequest, mockResponse)
    expect(mockJson.mock.calls[0][0]).toEqual({
      key: 'profile',
      children: [
        {
          key: 'subscriptions',
          children: [
            {
              key: 'subscription',
              children: [
                {
                  children: undefined,
                  key: 'subscriptionId',
                  value: 'sid1',
                },
              ],
            },
          ],
        },
      ],
    })
  })
  it('Should add displayable fields if displayble is enabled', async () => {
    getSubscriptionsByUserAdminMock.mockImplementationOnce(() => [
      {
        subscriptionId: 'sid1',
        meta: [
          {
            orderItemMetaId: 'oimid1',
            key: 'k1',
          },
        ],
      },
    ])
    await controller.implementation(
      {
        ...mockRequest,
        query: { displayable: true },
      },
      mockResponse
    )
    expect(mockJson.mock.calls[0][0]).toEqual({
      key: 'profile',
      children: [
        {
          key: 'subscriptions',
          children: [
            {
              key: 'subscription',
              children: [
                {
                  children: undefined,
                  key: 'subscriptionId',
                  value: 'sid1',
                  formatting: {
                    type: 'string',
                  },
                },
                {
                  key: 'meta',
                  children: [
                    {
                      key: 'metaItem',
                      children: [
                        {
                          children: undefined,
                          key: 'orderItemMetaId',
                          value: 'oimid1',
                          formatting: {
                            type: 'string',
                          },
                        },
                        {
                          children: undefined,
                          key: 'key',
                          value: 'k1',
                          formatting: {
                            type: 'string',
                          },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    })
  })
})
