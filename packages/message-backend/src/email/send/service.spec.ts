import { parseItemMetaVisibilityAndOrdinal } from './service'
import type { OrderItemMeta } from '../create/types'

describe('Test service.ts functions', () => {
  it('Should parse order metas to correct order and show only certain fields', async () => {
    const order = {
      meta: [
        {
          orderItemMetaId: 'ec627fb7-d557-4b7b-9c1c-61434322c109',
          orderItemId: 'orderItemId1',
          orderId: '76a9121f-3bb7-33b2-8ca8-bc6a23db24c1',
          key: 'meta key ordinal 0 show all',
          value: 'meta value ordinal 0 show all',
          label: 'meta label ordinal 0 show all',
          visibleInCheckout: 'true',
          ordinal: '0',
        },
        {
          orderItemMetaId: 'ec627fb7-d557-4b7b-9c1c-61434322c109',
          orderItemId: 'orderItemId1',
          orderId: '76a9121f-3bb7-33b2-8ca8-bc6a23db24c1',
          key: 'meta key no ordinal',
          value: 'when label is empty shows only value row',
          visibleInCheckout: 'true',
        },
        {
          orderItemMetaId: 'ec627fb7-d557-4b7b-9c1c-61434322c109',
          orderItemId: 'orderItemId2',
          orderId: '76a9121f-3bb7-33b2-8ca8-bc6a23db24c1',
          key: 'meta key ordinal 1',
          value: 'meta value ordinal 1',
          label: 'meta label ordinal 1',
          visibleInCheckout: 'true',
          ordinal: '1',
        },
        {
          orderItemMetaId: 'ec627fb7-d557-4b7b-9c1c-61434322c109',
          orderItemId: 'orderItemId3',
          orderId: 'no-ordinal-3bb7-33b2-8ca8-bc6a23db24c1',
          key: 'meta key no ordinal',
          value: 'meta value no ordinal',
          label: 'meta label no ordinal',
        },
        {
          orderItemMetaId: 'ec627fb7-d557-4b7b-9c1c-61434322c109',
          orderItemId: 'orderItemId3',
          orderId: 'no-ordinal-3bb7-33b2-8ca8-bc6a23db24c1',
          key: 'meta key should not show',
          value: 'meta value should not show',
          label: 'meta label should not show',
          visibleInCheckout: 'false',
        },
      ] as OrderItemMeta[],
    }

    order.meta = parseItemMetaVisibilityAndOrdinal(order.meta || [])

    expect(order.meta[0]).toEqual({
      orderItemMetaId: 'ec627fb7-d557-4b7b-9c1c-61434322c109',
      orderItemId: 'orderItemId1',
      orderId: '76a9121f-3bb7-33b2-8ca8-bc6a23db24c1',
      key: '',
      value: 'meta value ordinal 0 show all',
      label: 'meta label ordinal 0 show all',
      visibleInCheckout: 'true',
      ordinal: '0',
    })

    expect(order.meta[1]).toEqual({
      orderItemMetaId: 'ec627fb7-d557-4b7b-9c1c-61434322c109',
      orderItemId: 'orderItemId2',
      orderId: '76a9121f-3bb7-33b2-8ca8-bc6a23db24c1',
      key: '',
      value: 'meta value ordinal 1',
      label: 'meta label ordinal 1',
      visibleInCheckout: 'true',
      ordinal: '1',
    })

    expect(order.meta[2]).toEqual({
      orderItemMetaId: 'ec627fb7-d557-4b7b-9c1c-61434322c109',
      orderItemId: 'orderItemId1',
      orderId: '76a9121f-3bb7-33b2-8ca8-bc6a23db24c1',
      key: '',
      value: 'when label is empty shows only value row',
      visibleInCheckout: 'true',
    })

    expect(order.meta[3]).toEqual({
      orderItemMetaId: 'ec627fb7-d557-4b7b-9c1c-61434322c109',
      orderItemId: 'orderItemId3',
      orderId: 'no-ordinal-3bb7-33b2-8ca8-bc6a23db24c1',
      key: '',
      value: 'meta value no ordinal',
      label: 'meta label no ordinal',
    })
    // Last meta should be ignored because visibleInCheckout: 'false'
    expect(order.meta[4]).toBeUndefined()
  })
})
