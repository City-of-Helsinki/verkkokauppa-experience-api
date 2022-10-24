import axios from 'axios'
import {
  getMerchantDetailsForOrder,
  getMerchantValues,
} from '@verkkokauppa/configuration-backend'
import { getOrderAdmin } from '@verkkokauppa/order-backend'

beforeEach(() => {
  jest.clearAllMocks()
})
describe('Locally test merchant values from order and order/admin endpoints (Skipped in CI/CD)', () => {
  it('Should test merchant configuration', async () => {
    if (
      !process.env.IS_LOCAL_DEVELOPMENT &&
      process.env.IS_LOCAL_DEVELOPMENT != 'true'
    ) {
      console.log(
        'process.env.IS_LOCAL_DEVELOPMENT was not true skipping this test'
      )
      return
    }
    // Allows easier testing to
    process.env.MERCHANT_API_URL = 'http://host.docker.internal:8086/v1/asd'
    process.env.ORDER_BACKEND_URL = 'http://host.docker.internal:8183'
    process.env.PAYMENT_BACKEND_URL = 'http://host.docker.internal:8184'
    process.env.CONFIGURATION_BACKEND_URL =
      'http://host.docker.internal:8187/serviceconfiguration'
    const res = await getMerchantValues(
      'venepaikat',
      '1ec00f47-100a-4581-afff-ec926f6703fa'
    )
    console.log(JSON.stringify(res))
    expect(res).not.toBeNull()

    const orderId = 'dd8e429e-ef50-311e-ad7f-3938df96a73d'
    const orderWithNewMerchantConfigurations = await axios.get(
      'http://localhost:8084/v1/order/' + orderId,
      {
        headers: {
          user: 'dummy_user',
        },
      }
    )

    console.log(
      JSON.stringify(orderWithNewMerchantConfigurations.data.merchant)
    )

    expect(orderWithNewMerchantConfigurations.data.merchant).toEqual({
      merchantName: 'updated',
      merchantStreet: 'OVERRIDE:Konepajankuja 3',
      merchantZip: 'OVERRIDE:00510',
      merchantCity: 'OVERRIDE:Helsinki',
      merchantEmail: 'OVERRIDE:venepaikkavaraukset@hel.fi',
      merchantPhone: 'OVERRIDE:09 310 87900',
      merchantBusinessId: 'OVERRIDE:0201256-6',
      merchantUrl: 'OVERRIDE:https://venepaikka.test.kuva.hel.ninja/fi/',
      merchantTermsOfServiceUrl:
        'OVERRIDE:https://venepaikka.test.kuva.hel.ninja/traileriehdot',
    })

    const order = await getOrderAdmin({ orderId })
    const [merchant] = await Promise.all([getMerchantDetailsForOrder(order)])
    console.log(JSON.stringify(merchant))
    expect(orderWithNewMerchantConfigurations.data.merchant).toEqual(merchant)
  })
})
