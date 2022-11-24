import { parseUuidFromPaytrailRedirectCheckoutStamp } from './paytrail'

describe('Test parse orderId from paytrail redirect', () => {
  it('Should return correct orderId from paytrail redirectUrl', () => {
    const query = {
      'checkout-stamp': 'f9ab55be-dbfe-3b39-bb38-60306d6958f3_at_20210824-0635',
    }

    expect(parseUuidFromPaytrailRedirectCheckoutStamp({ query })).toBe(
      'f9ab55be-dbfe-3b39-bb38-60306d6958f3'
    )
  })
})
