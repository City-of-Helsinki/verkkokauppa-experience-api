import {
  getMerchantValues,
  getReducedServiceConfigurationsForNamespace,
} from './service'
import axios from 'axios'

beforeEach(() => {
  jest.clearAllMocks()
})
describe('Locally test merchant values (Skipped in CI/CD)', () => {
  it('Should test configuration', async () => {
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
    process.env.MERCHANT_EXPERIENCE_URL = 'http://host.docker.internal:8086/v1'
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
      'http://localhost:8084/v1/order/' + orderId
    )
    console.log(JSON.stringify(orderWithNewMerchantConfigurations))
  })

  it('Should get service configurations for namespace', async () => {
    if (
      !process.env.IS_LOCAL_DEVELOPMENT &&
      process.env.IS_LOCAL_DEVELOPMENT != 'true'
    ) {
      console.log(
        'process.env.IS_LOCAL_DEVELOPMENT was not true skipping this test'
      )
      return
    }
    process.env.MERCHANT_EXPERIENCE_URL = 'http://host.docker.internal:8086/v1'
    process.env.CONFIGURATION_BACKEND_URL =
      'http://host.docker.internal:8187/serviceconfiguration'

    const result = await getReducedServiceConfigurationsForNamespace(
      'venepaikat'
    )
    console.log(JSON.stringify(result, null, 2))
    expect(result).toBeTruthy()
  })
})
