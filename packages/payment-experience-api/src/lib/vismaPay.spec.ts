import { parseOrderIdFromRedirect } from './vismaPay'

describe('Test parse orderId from redirect', () => {
  it('Should return correct orderId from redirectUrl', () => {
    const query = {
      ORDER_NUMBER: 'f9ab55be-dbfe-3b39-bb38-60306d6958f3_at_20210824-0635',
    }

    expect(parseOrderIdFromRedirect({ query })).toBe(
      'f9ab55be-dbfe-3b39-bb38-60306d6958f3'
    )
  })
})
