import jestOpenAPI from 'jest-openapi'
import axios from 'axios'
const path = require('path')

// Sets the location of your OpenAPI Specification file
jestOpenAPI(path.join(__dirname, '../openapi.yaml'))
const merchantBaseUrl = 'http://localhost:8086/v1/merchant'
describe('router.js', () => {
  if (process.env.IS_LOCAL_DEVELOPMENT != 'true') {
    /* eslint-disable */
    test.only('skipping all other things', () => {
      console.warn('skipping tests')
    })
  }

  beforeEach(() => {
    process.env.CONFIGURATION_BACKEND_URL = 'http://host.docker.internal:8187/serviceconfiguration'
  });

  it('Requesting existing service configurations returns status 200', async () => {
    // Get an HTTP response from your server
    const res = await axios.get(merchantBaseUrl + '/venepaikat')
    console.log(JSON.stringify(res.data))
    expect(res.status).toEqual(200)
    // Assert that the HTTP response satisfies the OpenAPI spec
    expect(res.data).toSatisfySchemaInApiSpec('MerchantConfigurations')
  })

})
