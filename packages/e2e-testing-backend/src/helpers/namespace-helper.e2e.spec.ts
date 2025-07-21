import {
  conditionalTest,
  createApiAccess,
  createLocalTunnelUrl,
  createNamespace,
  getApiAccessToken,
  loadLocalEnv,
  updateNamespaceValues,
} from './namespace-helper'

// Determine if we are in local development mode
const isLocalDevelopment = process.env.IS_LOCAL_DEVELOPMENT === 'true'
beforeAll(() => {
  loadLocalEnv()
})
describe('Namespace Helper Functions (Integration Tests)', () => {
  const namespace = 'test-namespace'
  const configurations = [
    {
      key: 'merchantOrderWebhookUrl',
      value: 'https://example.com/webhook',
      restricted: false,
    },
  ]

  // Using `conditionalTest` to skip or run tests based on the condition
  conditionalTest(
    isLocalDevelopment,
    'should create a namespace successfully',
    async () => {
      const result = await createNamespace(namespace, configurations)
      console.log('Namespace created:', result)
      // eslint-disable-next-line jest/no-standalone-expect
      expect(result).toHaveProperty('success', true)
    }
  )

  conditionalTest(
    isLocalDevelopment,
    'should update namespace values',
    async () => {
      const result = await updateNamespaceValues(namespace, configurations)
      console.log('Namespace updated:', result)
      expect(result).toHaveProperty('updated', true)
    }
  )

  conditionalTest(
    isLocalDevelopment,
    'should fetch API access token',
    async () => {
      const result = await getApiAccessToken(namespace)
      console.log('API access token:', result)
      expect(typeof result).toBe('string')
    }
  )

  conditionalTest(
    isLocalDevelopment,
    'should create API access token',
    async () => {
      const result = await createApiAccess(namespace)
      console.log('API access token created:', result)
      expect(result).toHaveProperty('apiKey')
    }
  )

  conditionalTest(
    isLocalDevelopment,
    'should create a local tunnel URL',
    async () => {
      const result = await createLocalTunnelUrl()
      console.log('Ngrok tunnel URL:', result)
      expect(result.startsWith('https://')).toBe(true)
    }
  )
})
