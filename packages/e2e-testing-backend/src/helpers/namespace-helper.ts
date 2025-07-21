/* eslint-disable jest/no-export */

import axios from 'axios'
import * as path from 'path'
import * as fs from 'fs'
import type {
  CreatedTestOrder,
  CreateTestOrder,
  InitializedTestNamespace,
  TestConfirmPaymentParams,
  TestPaymentMethodResponse,
  TestSelectPaymentMethodParams,
} from './types'
import { chromium } from 'playwright' // Import Playwright
// Import Axios
const ngrok = require('@ngrok/ngrok')
const dotenv = require('dotenv')

/**
 * Create a namespace using Axios POST request.
 *
 * @param {string} namespace - The namespace to create.
 * @param {Array<Object>} configurations - An array of configuration objects.
 * @param {string} [configurations[].key] - The configuration key.
 * @param {string} [configurations[].value] - The configuration value.
 * @param {boolean} [configurations[].restricted] - Whether the configuration is restricted.
 * @returns {Promise<void>} - A promise that resolves when the namespace is created.
 */
export async function createNamespace(
  namespace: string,
  configurations: {
    key: string
    value: string | undefined
    restricted: boolean
  }[]
) {
  try {
    // Get URLs from environment variables
    const url = `${process.env.MERCHANT_CONFIGURATION_BACKEND_URL}/namespace/create`

    // Prepare data
    const data = {
      namespace: namespace,
      configurations: configurations,
    }

    // Axios POST request
    const response = await axios.post(url, data, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })

    // Log response data
    console.log('Namespace created:', response.data)
    return response.data
  } catch (error) {
    if (error.response.status === 400) {
      try {
        await updateNamespaceValues(namespace, configurations)
      } catch (e) {
        console.error('Upserting namespace values failed', e)
      }
    }
    // Log any errors
    console.error('There was a problem with the request:', error.message)
  }
}

/**
 * Create a namespace using Axios POST request.
 *
 * @param {string} namespace - The namespace to create.
 * @param {Array<Object>} configurations - An array of configuration objects.
 * @param {string} [configurations[].key] - The configuration key.
 * @param {string} [configurations[].value] - The configuration value.
 * @param {boolean} [configurations[].restricted] - Whether the configuration is restricted.
 * @returns {Promise<void>} - A promise that resolves when the namespace is created.
 */
export async function updateNamespaceValues(
  namespace: string,
  configurations: {
    key: string
    value: string | undefined
    restricted: boolean
  }[]
) {
  try {
    // Get URLs from environment variables
    const url = `${process.env.MERCHANT_CONFIGURATION_BACKEND_URL}/namespace/updateValues`

    // Prepare data
    const data = {
      namespace: namespace,
      configurations: configurations,
    }

    // Axios POST request
    const response = await axios.post(url, data, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })

    // Log response data
    console.log('Namespace updated:', response.data)
    return response.data
  } catch (error) {
    // Log any errors
    console.error('There was a problem with the request:', error.message)
  }
}

/**
 * Fetch service configuration from the specified namespace.
 *
 * @param {string} namespace - The namespace for the service configuration.
 * @returns {Promise<Object|null>} - A promise that resolves with the service configuration or null if there's an error.
 */
export async function getApiAccessToken(namespace: string) {
  const url = `${process.env.PRODUCT_MAPPING_BACKEND_URL}/serviceconfiguration/api-access/get?namespace=${namespace}`

  try {
    const response = await axios.get(url, {
      headers: {
        Accept: '*/*',
      },
    })

    return response.data
  } catch (error) {
    console.error(
      'Error fetching service configuration, trying to create:',
      error.message
    )
    return null // Return null if there's an error
  }
}

/**
 * Create service configuration for the specified namespace.
 *
 * @param {string} namespace - The namespace for the service configuration.
 * @returns {Promise<Object>} - A promise that resolves with the created service configuration.
 */
export async function createApiAccess(namespace: string) {
  const url = `${process.env.PRODUCT_MAPPING_BACKEND_URL}/serviceconfiguration/api-access/create?namespace=${namespace}`

  try {
    const response = await axios.get(url, {
      headers: {
        Accept: '*/*',
      },
    })

    return response.data
  } catch (error) {
    console.error('Error creating service configuration:', error.message)
    throw error // Throw the error if the create request fails
  }
}
/**
 * Create service configuration for the specified namespace.
 *
 * @param {string} namespace - The namespace for the service configuration.
 * @returns {Promise<Object>} - A promise that resolves with the created service configuration.
 */
export async function createWebhookApiAccess(namespace: string) {
  const url = `${process.env.PRODUCT_MAPPING_BACKEND_URL}/serviceconfiguration/webhook-api-access/get?namespace${namespace}`

  try {
    const response = await axios.get(url, {
      headers: {
        Accept: '*/*',
      },
    })

    return response.data
  } catch (error) {
    console.error('Error creating createWebhookApiAccess', error.message)
    throw error // Throw the error if the create request fails
  }
}

/**
 * @typedef {Object} ProductMapping
 * @property {string} namespace - The namespace for the product.
 * @property {string} namespaceEntityId - The namespaceEntityId for the product.
 * @property {string} merchantId - The merchantId for the product.
 * @property {string} productId - The productId for the product.
 */

/**
 * Create a product using Axios POST request.
 *
 * @param {string} namespace - The namespace for the product.
 * @param {string} namespaceEntityId - The namespaceEntityId for the product.
 * @param {string} merchantId - The merchantId for the product.
 * @returns {Promise<ProductMapping>} - A promise that resolves with the response data.
 */
export async function createProductMapping(
  namespace: string,
  namespaceEntityId: string,
  merchantId: any
) {
  const url = `${process.env.PRODUCT_EXP_API_URL}`

  // Prepare data
  const data = {
    namespace: namespace,
    namespaceEntityId: namespaceEntityId,
    merchantId: merchantId,
  }

  try {
    const response = await axios.post(url, data, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })

    return response.data
  } catch (error) {
    console.error('Error creating product:', error.message)
    throw error // Throw the error if the POST request fails
  }
}

/**
 * Create accounting details for a product using Axios POST request.
 *
 * @param {string} productId - The ID of the product.
 * @param {Object} accountingData - Accounting details for the product.
 * @param {string} accountingData.vatCode - The VAT code for the product.
 * @param {string} accountingData.internalOrder - The internal order for the product.
 * @param {string} accountingData.profitCenter - The profit center for the product.
 * @param {string} accountingData.balanceProfitCenter - The balance profit center for the product.
 * @param {string} accountingData.project - The project for the product.
 * @param {string} accountingData.operationArea - The operation area for the product.
 * @param {string} accountingData.companyCode - The company code for the product.
 * @param {string} accountingData.mainLedgerAccount - The main ledger account for the product.
 * @param {Object} accountingData.productInvoicing - Product invoicing details.
 * @param {string} accountingData.productInvoicing.salesOrg - The sales organization for the product.
 * @param {string} accountingData.productInvoicing.salesOffice - The sales office for the product.
 * @param {string} accountingData.productInvoicing.material - The material for the product.
 * @param {string} accountingData.productInvoicing.orderType - The order type for the product.
 * @param {Object} accountingData.nextEntity - The next set of accounting details that will be applied after the `activeFrom` date has elapsed.
 * @param {string} accountingData.nextEntity.vatCode - The VAT code for the product in the next accounting period.
 * @param {string} accountingData.nextEntity.internalOrder - The internal order for the product in the next accounting period.
 * @param {string} accountingData.nextEntity.profitCenter - The profit center for the product in the next accounting period.
 * @param {string} accountingData.nextEntity.balanceProfitCenter - The balance profit center for the product in the next accounting period.
 * @param {string} accountingData.nextEntity.project - The project for the product in the next accounting period.
 * @param {string} accountingData.nextEntity.operationArea - The operation area for the product in the next accounting period.
 * @param {string} accountingData.nextEntity.companyCode - The company code for the product in the next accounting period.
 * @param {string} accountingData.nextEntity.mainLedgerAccount - The main ledger account for the product in the next accounting period.
 * @param {string} accountingData.activeFrom - The date and time from which the `nextEntity` accounting details become active.
 * The value should be in ISO 8601 format (e.g., "2024-08-19T13:33:19.683Z").
 * @returns {Promise<Object>} - A promise that resolves with the response data.
 */
export async function createProductAccounting(
  productId: any,
  accountingData: {
    vatCode: string
    balanceProfitCenter: string // https://helsinkisolutionoffice.atlassian.net/browse/KYV-1052
    project: string
    companyCode: string
    mainLedgerAccount: string
    activeFrom: string
    nextEntity: {
      // companyCode: 'companyCode2',
      mainLedgerAccount: string
      vatCode: string
      // internalOrder: 'internalOrder2',
      // profitCenter: 'profitCenter2',
      // balanceProfitCenter: 'balanceProfitCenter2',
      project: string
      operationArea: string
    }
  }
) {
  const url = `${process.env.PRODUCT_EXP_API_URL}/${productId}/accounting`

  try {
    const response = await axios.post(url, accountingData, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })

    return response.data
  } catch (error) {
    console.error('Error creating product accounting:', error.message)
    throw error // Throw the error if the POST request fails
  }
}

/**
 * Check if a merchant with the specified name exists.
 *
 * @param {string} merchantName - The name of the merchant to check.
 * @param namespace
 * @returns {Promise<{ exists: boolean, merchantId?: string }>} - A promise that resolves with a boolean indicating whether the merchant exists and the merchantId if found.
 *  */
export async function checkMerchantExists(
  merchantName: string,
  namespace: string
) {
  const url = `${process.env.MERCHANT_API_URL}list/merchants/${namespace}`

  try {
    const response = await axios.get(url)
    const merchants = response.data
    if (!merchants || merchants.length === 0) {
      return { exists: false }
    }
    // Find the merchant with the same merchantName
    for (const [, merchant] of Object.entries(merchants)) {
      // @ts-ignore
      const merchantNameConfig = merchant.configurations.find(
        // @ts-ignore
        (config) => config.key === 'merchantName'
      )
      if (merchantNameConfig && merchantNameConfig.value === merchantName) {
        // @ts-ignore
        return { exists: true, merchantId: merchant?.merchantId }
      }
    }

    return { exists: false }
  } catch (error) {
    console.error('Error checking merchant existence:', error.message)
    return { exists: false }
  }
}

/**
 * Create a merchant using Axios POST request.
 *
 * @param {Object} merchantData - The merchant data.
 * @param {string} merchantData.merchantName - The name of the merchant.
 * @param {string} merchantData.merchantStreet - The street of the merchant.
 * @param {string} merchantData.merchantZip - The ZIP code of the merchant.
 * @param {string} merchantData.merchantCity - The city of the merchant.
 * @param {string} merchantData.merchantEmail - The email of the merchant.
 * @param {string} merchantData.merchantPhone - The phone number of the merchant.
 * @param {string} merchantData.merchantUrl - The URL of the merchant.
 * @param {string} merchantData.merchantTermsOfServiceUrl - The terms of service URL of the merchant.
 * @param {string} merchantData.merchantBusinessId - The business ID of the merchant.
 * @param {string} merchantData.merchantShopId - The shop ID of the merchant.
 * @param {string} merchantData.merchantPaytrailMerchantId - The Paytrail merchant ID of the merchant.
 * @returns {Promise<Object>} - A promise that resolves with the response data.
 * @param {string} namespace
 */
export async function upsertMerchant(
  merchantData: {
    merchantName: string
    merchantStreet: string
    merchantZip: string
    merchantCity: string
    merchantEmail: string
    merchantPhone: string
    merchantUrl: string
    merchantTermsOfServiceUrl: string
    merchantBusinessId: string
    merchantShopId: string
    merchantPaytrailMerchantId: string
  },
  namespace: string
) {
  const url = `${process.env.MERCHANT_API_URL}create/merchant/${namespace}`

  try {
    try {
      const response = await axios.post(url, merchantData)
      return response.data
    } catch (error) {
      console.error('Error creating merchant:', error.message)
      throw error // Throw the error if the POST request fails
    }
  } catch (error) {
    console.error('Error checking merchant existence:', error.message)
    throw error // Throw the error if the GET request fails
  }
}

/**
 * Create service mappings using Axios GET request.
 *
 * @param {string} namespace - The namespace for the service mappings.
 * @param {Array<Object>} serviceMappings - The array of service mappings.
 * @returns {Promise<Array>} - A promise that resolves with an array of response data.
 */
export async function createServiceMappings(
  namespace: string,
  serviceMappings: { type: string; serviceUrl: string }[]
) {
  const baseUrl = `${process.env.PRODUCT_MAPPING_BACKEND_URL}/servicemapping/create`

  // Array to hold promises for all Axios requests
  const requests = []

  for (const mapping of serviceMappings) {
    const url = `${baseUrl}?namespace=${namespace}&type=${mapping.type}&serviceUrl=${mapping.serviceUrl}`

    // Push the Axios GET request promise to the array
    requests.push(axios.get(url))
  }

  try {
    // Wait for all Axios requests to complete
    const responses = await Promise.all(requests)
    return responses.map((response) => response.data)
  } catch (error) {
    console.error('Error creating service mappings:', error.message)
    throw error // Throw the error if any GET request fails
  }
}

/**
 * This creates product to database -> This needs product mappings and service mappings?
 * Fetch product data from backend using Axios GET request.
 *
 * @param {string} productId - The ID of the product to fetch.
 * @returns {Promise<Object>} - A promise that resolves with the response data.
 * @param internalProductName
 */
export async function createInternalProduct(
  productId: any,
  internalProductName: string
) {
  const url = `${process.env.PRODUCT_BACKEND_URL}/product/createInternalProduct?productId=${productId}&productName=${internalProductName}`

  try {
    const response = await axios.get(url, {
      headers: {
        Accept: '*/*',
      },
    })

    return response.data
  } catch (error) {
    console.error('Error fetching product from backend:', error.message)
    throw error // Throw the error if the GET request fails
  }
}

/**
 * This creates product to database -> This needs product mappings and service mappings?
 * Fetch product data from backend using Axios GET request.
 *
 * @param {string} productId - The ID of the product to fetch.
 * @returns {Promise<Object>} - A promise that resolves with the response data.
 * @param productPrice - The price of the product
 * @param productVatPercentage - The VAT percentage of the product
 */
export async function createInternalPrice(
  productId: any,
  productPrice: string,
  productVatPercentage: string
) {
  const url = `${process.env.PRICE_BACKEND_URL}/price/createInternalPrice?productId=${productId}&productPrice=${productPrice}&productVatPercentage=${productVatPercentage}`

  try {
    const response = await axios.get(url, {
      headers: {
        Accept: '*/*',
      },
    })

    return response.data
  } catch (error) {
    console.error('Error createInternalPrice to backend:', error.message)
    throw error // Throw the error if the GET request fails
  }
}

/**
 * Adds a Paytrail secret mapping to the backend.
 *
 * @param {string} merchantId - The Paytrail Merchant ID.
 * @param {string} secret - The Paytrail secret.
 * @param {string} namespace - The namespace for the merchant.
 * @param {string} [description] - An optional description for the mapping.
 * @param {string} [id] - An optional ID for the mapping.
 * @returns {Promise<Object>} - A promise that resolves with the response data.
 */
export async function addPaytrailSecretMap(
  merchantId: string,
  secret: string,
  namespace: string,
  description = ''
) {
  const url = `${process.env.MERCHANT_CONFIGURATION_BACKEND_URL}/merchant/paytrail-merchant-mapping/add`

  const data = {
    namespace: namespace,
    merchantPaytrailMerchantId: merchantId,
    merchantPaytrailSecret: secret,
    description: description,
  }

  try {
    const response = await axios.post(url, data, {
      headers: {
        Accept: '*/*',
        'Content-Type': 'application/json',
      },
    })

    return response.data
  } catch (error) {
    console.error(`Error posting to ${url} to backend:`, error.message)
    return null
  }
}

/**
 * Create a merchant using Axios POST request.
 *
 * @param {Object} merchantData - The merchant data.
 * @param {string} merchantData.namespace
 * @param {string} merchantData.merchantPaytrailMerchantId
 * @param {string} merchantData.merchantPaytrailSecret
 * @param {string} merchantData.description
 * @param {string} merchantData.id
 * @returns {Promise<Object>} - A promise that resolves with the response data.
 *
 */
export async function createPaytrailMerchantMapping(merchantData: any) {
  const url = `${process.env.MERCHANT_CONFIGURATION_BACKEND_URL}/merchant/paytrail-merchant-mapping/add`

  try {
    try {
      const response = await axios.post(url, merchantData)
      return response.data
    } catch (error) {
      console.error(
        'Error creating createPaytrailMerchantMapping:',
        error.message
      )
      throw error // Throw the error if the POST request fails
    }
  } catch (error) {
    console.error('Error createPaytrailMerchantMapping:', error.message)
    return null
  }
}

/**
 * Fetch product data from internal backend using Axios GET request.
 *
 * @param {string} productId - The ID of the product to fetch.
 * @returns {Promise<Object>} - A promise that resolves with the response data.
 */
export async function getInternalProduct(productId: string) {
  const url = `${process.env.PRODUCT_BACKEND_URL}/product/get/internal?productId=${productId}`

  try {
    const response = await axios.get(url, {
      headers: {
        Accept: '*/*',
      },
    })

    return response.data
  } catch (error) {
    console.error(`Error ${url} to backend:`, error.message)
    throw error // Throw the error if the GET request fails
  }
}

/**
 * Fetch product data from internal backend using Axios GET request.
 *
 * @param {string} productId - The ID of the product to fetch.
 * @returns {Promise<Object>} - A promise that resolves with the response data.
 */
export async function getInternalPrice(productId: string) {
  const url = `${process.env.PRICE_BACKEND_URL}/price/get/internal?productId=${productId}`

  try {
    const response = await axios.get(url, {
      headers: {
        Accept: '*/*',
      },
    })

    return response.data
  } catch (error) {
    console.error(`Error ${url} to backend:`, error.message)
    throw error // Throw the error if the GET request fails
  }
}

/**
 * Save payment filters using Axios POST request.
 *
 * @param {Array<Object>} filters - The payment filters array.
 * @param {string} filters[].namespace - The namespace.
 * @param {string} filters[].referenceId - The reference ID.
 * @param {string} filters[].referenceType - The reference type.
 * @param {string} filters[].filterType - The filter type.
 * @param {string} filters[].value - The value.
 * @returns {Promise<Object>} - A promise that resolves with the response data.
 */
export async function savePaymentFilters(
  filters: {
    namespace: string
    referenceId: any
    referenceType: string
    filterType: string
    value: string
  }[]
) {
  const url = `${process.env.PAYMENT_BACKEND_URL}/payment-admin/online/save-payment-filters`

  try {
    const response = await axios.post(url, filters, {
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })
    return response.data
  } catch (error) {
    console.error('Error saving payment filters:', error.message)
    throw error // Throw the error if the POST request fails
  }
}

/**
 * @param {{configurationKey: string, namespace: string, configurationValue: *}} params
 */
export async function createRestrictedServiceConfiguration(params: any) {
  try {
    const response = await axios.get(
      `${process.env.PRODUCT_MAPPING_BACKEND_URL}/serviceconfiguration/restricted/create`,
      {
        params: params,
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
        },
      }
    )
    return response.data
  } catch (error) {
    console.error('Error createRestrictedServiceConfiguration ', error.message)
    throw error // Throw the error if the POST request fails
  }
}

/**
 * @param orderToCreate - request orderToCreate adhering to RequestSchema
 */
export async function createTestOrder(orderToCreate: CreateTestOrder) {
  try {
    const response = await axios.post<CreatedTestOrder>(
      `${process.env.ORDER_EXP_API_URL}`,
      {
        ...orderToCreate,
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
        },
      }
    )
    return response.data
  } catch (error) {
    console.error('Error creating order: ', error.message)
    throw error // Throw the error if the request fails
  }
}

export async function selectTestPaymentMethod({
  orderId,
  paymentMethod,
}: TestSelectPaymentMethodParams): Promise<TestPaymentMethodResponse> {
  try {
    const response = await axios.post<TestPaymentMethodResponse>(
      `${process.env.ORDER_EXP_API_URL}${orderId}/paymentMethod`,
      {
        paymentMethod: paymentMethod,
      }
    )

    return response.data
  } catch (error) {
    console.error('Error selecting payment method:', error)
    throw error
  }
}

export async function createLocalTunnelUrl() {
  const authtoken = process.env.NGROK_AUTHTOKEN
  const listener = await ngrok.connect({
    addr: 'http://localhost:8085', // port or network address, defaults to 80 PAYMENT_EXP_API
    authtoken: authtoken, // your authtoken from ngrok.com
    region: 'eu', // one of ngrok regions (us, eu, au, ap, sa, jp, in), defaults to us
  }) // https://757c1652.ngrok.io -> http://localhost:9090
  console.log(listener.url())

  return listener.url()
}

export async function createAndInitializeNamespace(parameters: {
  namespace: string
}): Promise<InitializedTestNamespace> {
  const { namespace } = parameters
  const merchantPaytrailMerchantId = process.env.PAYTRAIL_MERCHANT_ID || ''
  const merchantPaytrailMerchantSecret =
    process.env.PAYTRAIL_MERCHANT_SECRET || ''

  // Usage
  const configurations = [
    {
      key: 'merchantOrderWebhookUrl',
      value: process.env.WEBHOOK_URL,
      restricted: false,
    },
    {
      key: 'merchantPaymentWebhookUrl',
      value: process.env.WEBHOOK_URL,
      restricted: false,
    },
    {
      key: 'merchantRefundWebhookUrl',
      value: process.env.WEBHOOK_URL,
      restricted: false,
    },
    {
      key: 'merchantSubscriptionWebhookUrl',
      value: process.env.WEBHOOK_URL,
      restricted: false,
    },
    {
      key: 'orderRightOfPurchaseIsActive',
      value: 'orderRightOfPurchaseIsActive',
      restricted: false,
    },
    {
      key: 'orderRightOfPurchaseUrl',
      value: 'orderRightOfPurchaseUrl',
      restricted: false,
    },
    {
      key: 'sendMerchantTermsOfService',
      value: 'sendMerchantTermsOfService',
      restricted: false,
    },
    {
      key: 'subscriptionPriceUrl',
      value: 'subscriptionPriceUrl',
      restricted: false,
    },
    {
      key: 'subscriptionResolveProductUrl',
      value: 'subscriptionResolveProductUrl',
      restricted: false,
    },
  ]

  let localTunnelUrl
  try {
    localTunnelUrl = await createLocalTunnelUrl()
  } catch (e) {
    console.log(e)
  }

  const createdNamespace = await createNamespace(namespace, configurations)
  console.log(createdNamespace)

  if (process.env.IS_LOCAL) {
    await updateNamespaceValues(namespace, [
      {
        key: 'payment_notification_url',
        value: `${localTunnelUrl}/v1/payment/paytrailOnlinePayment/notify`,
        restricted: false,
      },
    ])
    await updateNamespaceValues(namespace, [
      {
        key: 'refund_success_notification_url',
        value: `${localTunnelUrl}/v1/payment/paytrailOnlineRefund/success`,
        restricted: false,
      },
    ])
    await updateNamespaceValues(namespace, [
      {
        key: 'refund_cancel_notification_url',
        value: `${localTunnelUrl}/v1/payment/paytrailOnlineRefund/cancel`,
        restricted: false,
      },
    ])
  }

  let apiKey = await getApiAccessToken(namespace)

  if (!apiKey) {
    try {
      apiKey = await createApiAccess(namespace)
    } catch (error) {
      console.error('There was a problem:', error.message)
      // @ts-ignore
      return
    }
  }

  try {
    apiKey = await createWebhookApiAccess(namespace)
  } catch (error) {
    console.error('There was a createWebhookApiAccess problem:', error.message)
  }

  // Set the default api-key header globally for Axios
  axios.defaults.headers.common['api-key'] = apiKey
  axios.defaults.headers.common['namespace'] = namespace

  let merchantOverrides = {}

  const merchantData = {
    merchantName: 'City of Helsinki / Helsinki City Library',
    merchantStreet: 'Konepajankuja 3',
    merchantZip: '00510',
    merchantCity: 'Helsinki',
    merchantEmail: '+358 9 310 1691',
    merchantPhone: 'conferences.library@hel.fi',
    merchantUrl: 'https://oodihelsinki.fi/en/nlt/',
    merchantTermsOfServiceUrl: 'https://checkout.hel.fi/fi/information',
    merchantBusinessId: '0201256-6',
    merchantShopId: 'merchantShopId',
    merchantPaytrailMerchantId: merchantPaytrailMerchantId,
    ...merchantOverrides,
  }
  await addPaytrailSecretMap(
    merchantPaytrailMerchantId,
    merchantPaytrailMerchantSecret,
    namespace
  )
  const { exists, merchantId } = await checkMerchantExists(
    merchantData.merchantName,
    namespace
  )

  // Check if the merchant with the same merchantName exists

  let merchant = null
  try {
    if (exists) {
      // @ts-ignore
      merchantData.merchantId = merchantId
    }

    merchant = await upsertMerchant(merchantData, namespace)
    console.log('Merchant created/ updated:', merchant)
  } catch (error) {
    console.error('There was a problem:', error.message)
    // @ts-ignore
    return
  }

  try {
    const productMockBackend =
      process.env.SERVICE_MAPPING_PRODUCT_MOCK_BACKEND_URL
    const serviceMappings = [
      {
        type: 'product',
        serviceUrl: `${process.env.SERVICE_MAPPING_PRODUCT_BACKEND_URL}/product/get/internal?productId=`,
      },
      {
        type: 'price',
        serviceUrl: `${process.env.SERVICE_MAPPING_PRICE_BACKEND_URL}/price/get/internal?productId=`,
      },
      {
        type: 'availability',
        serviceUrl: `${productMockBackend}/internal/${namespace}/availability?productId=`,
      },
      {
        type: 'right-of-purchase',
        serviceUrl: `${productMockBackend}/internal/${namespace}/right-of-purchase?productId=`,
      },
    ]
    const mappings = await createServiceMappings(namespace, serviceMappings)

    console.log('Service mappings created:', mappings)
  } catch (error) {
    console.error(
      'There was a problem on service mappings created:',
      error.message
    )
  }

  const namespaceEntityId =
    'namespaceEntityId' + (Math.random() + 1).toString(36).substring(7)
  console.log('namespaceEntityId', namespaceEntityId)

  const addPaymentFilters = false
  if (addPaymentFilters) {
    // Example usage:
    const paymentMethodFilters = [
      {
        namespace: namespace,
        referenceId: merchant.merchantId || merchantId,
        referenceType: 'merchant',
        filterType: 'bank',
        value: 'bank',
      },
      {
        namespace: namespace,
        referenceId: merchant.merchantId || merchantId,
        referenceType: 'merchant',
        filterType: 'mobile',
        value: 'mobile',
      },
    ]

    const savedFilters = await savePaymentFilters(paymentMethodFilters)
    console.log('Payment filters saved:', savedFilters)
  }

  const productName = 'Nordic Libraries Together 2024 participation fee'
  const productPrice = '250'
  const productVatPercentage = '25.5'

  try {
    const product = await createProductMapping(
      namespace,
      namespaceEntityId,
      merchant.merchantId || merchantId
    )
    const generatedProductId = product.productId
    const createdProduct = await createInternalProduct(
      generatedProductId,
      productName
    )

    // Tuotteen tiedot selvitetty
    // Hinta 250,00 euroa
    // Nimi “Nordic Libraries Together 2024 participation fee”
    // tiliöintitiedot
    // GLAccount 350055
    // Project 2940110
    // VatCode 4Z
    // Tuote ja sen tiliöinnit luotu kaikkiin ympäristöihin
    const productAccounting = await createProductAccounting(
      generatedProductId,
      {
        vatCode: '4Z',
        balanceProfitCenter: '2940000', // https://helsinkisolutionoffice.atlassian.net/browse/KYV-1052
        project: '2940110',
        companyCode: '2900',
        mainLedgerAccount: '350055',
        activeFrom: '2024-08-21T10:00:00.000Z',
        nextEntity: {
          mainLedgerAccount: 'mainLedgerAccount2',
          vatCode: '47',
          project: 'project2',
          operationArea: 'operationArea2',
        },
      }
    )

    const createdPrice = await createInternalPrice(
      generatedProductId,
      productPrice,
      productVatPercentage
    )

    console.log('Product created with mappings:', createdProduct)
    console.log('Product created:', product)
    console.log('createdPrice created:', createdPrice)
    console.log('productAccounting created:', productAccounting)

    const quantity = `1`

    const internalProduct = await getInternalProduct(namespaceEntityId)
    const internalPrice = await getInternalPrice(namespaceEntityId)
    console.log('internalProduct', internalProduct)
    console.log('internalPrice', internalPrice)

    const kassaUrl = `${process.env.REDIRECT_PAYMENT_URL_BASE}/purchase/${generatedProductId}?language=fi&quantity=${quantity}&namespace=${namespace}`
    console.log(`Kassa url: ${kassaUrl}`)

    if (process.env.IS_LOCAL) {
      // console.log(
      //   'Keeping local tunnel open for one hour, kill by ctrl+c or terminating script'
      // )
      // await sleep(3600000)
    }
    return {
      namespace,
      merchant,
      createdNamespace,
      internalProduct,
      internalPrice,
      createdPrice,
      productAccounting,
      kassaUrl,
    }
  } catch (error) {
    console.error('There was a problem:', error.message)
  }
  throw new Error('createAndInitializeNamespace function failed')
}

/**
 * Conditionally run or skip a test based on the provided condition.
 * @param condition - A boolean condition that determines whether to run the test.
 * @param name - The name of the test.
 * @param fn - The test function to execute if the condition is true.
 */
export const conditionalTest = (
  condition: boolean,
  name: string,
  fn: jest.ProvidesCallback
): void => {
  if (condition) {
    // eslint-disable-next-line jest/expect-expect,jest/valid-title
    it(name, fn) // Always calls `it`, keeping `expect` inside the test block
  } else {
    // eslint-disable-next-line jest/no-disabled-tests,jest/valid-title
    it.skip(name, fn) // Skips the test
  }
}
/**
 * Conditionally run or skip a test based on the provided condition.
 * @param name - The name of the test.
 * @param fn - The test function to execute if the condition is true.
 * @param timeout
 */
export const localTest = (
  name: string,
  fn: jest.ProvidesCallback,
  timeout: number = 90000
): void => {
  if (isLocalDevelopment) {
    // eslint-disable-next-line jest/expect-expect,jest/valid-title
    it(name, fn, timeout) // Always calls `it`, keeping `expect` inside the test block
  } else {
    // eslint-disable-next-line jest/no-disabled-tests,jest/valid-title
    it.skip(name, fn) // Skips the test
  }
}

export const isLocalDevelopment = process.env.IS_LOCAL_DEVELOPMENT === 'true'

// Function to load environment variables from the specified file
export const loadLocalEnv = (setJestTimeout = true) => {
  const envPath = path.resolve(__dirname, '../../.env.local')

  if (fs.existsSync(envPath)) {
    dotenv.config({
      path: envPath,
      override: true,
    })
    console.log(`Environment variables loaded from ${envPath}`)

    if (setJestTimeout && process.env.JEST_TIMEOUT) {
      jest.setTimeout(parseInt(process.env.JEST_TIMEOUT))
    }
  } else {
    console.warn(`Warning: ${envPath} does not exist.`)
  }
}

export const generateTestUUIDv4 = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (char) {
    const random = (Math.random() * 16) | 0 // Generate a random number between 0 and 15
    const value = char === 'x' ? random : (random & 0x3) | 0x8 // For 'y', use random number with 0x8 or 0x3
    return value.toString(16) // Convert to hexadecimal
  })

export async function confirmTestOrderAndCreatePayment({
  orderId,
  paymentMethod,
  language,
  gateway,
}: TestConfirmPaymentParams): Promise<any> {
  try {
    const response = await axios.post(
      `http://localhost:8084/v1/order/${orderId}/confirmAndCreatePayment`,
      {
        paymentMethod: paymentMethod,
        language: language,
        gateway: gateway,
      },
      {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      }
    )

    return response.data
  } catch (error) {
    console.error('Error confirming and creating payment:', error)
    throw error
  }
}

export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms))

export async function callPaytrailWithFormData(confirmedOrder: {
  payment: { paytrailProvider: { url: string; parameters: any } }
}) {
  let responseFromPaytrail = null

  // Create HTML form dynamically with the parameters
  const createFormHTML = (
    url: string,
    parameters: { name: string; value: string | number | boolean }[]
  ) => {
    let formHTML = `<form id="paytrailForm" method="POST" action="${url}">`

    // Loop through parameters and add them as hidden inputs
    parameters.forEach((param) => {
      formHTML += `<input type="hidden" name="${param.name}" value="${param.value}"/>`
    })

    formHTML += `
      </form>
      <script type="text/javascript">
        document.getElementById('paytrailForm').submit();
      </script>
    `

    return formHTML
  }

  try {
    // Launch a Playwright browser (Chromium in this case)
    const browser = await chromium.launch({ headless: true })
    // Create a new incognito context (no session, cookies, cache)
    const context = await browser.newContext() // Incognito-like context

    // Create a new page in this incognito context
    const page = await context.newPage()

    // Create the form HTML with parameters
    const formHTML = createFormHTML(
      confirmedOrder.payment.paytrailProvider.url,
      confirmedOrder.payment.paytrailProvider.parameters
    )

    // Set the HTML content of the page (replace the default about:blank)
    await page.setContent(formHTML, { timeout: 5000 })

    // Wait for the page to submit the form and navigate
    await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 5000 })

    // Get the response after form submission
    responseFromPaytrail = await page.evaluate(() => {
      // @ts-ignore
      // eslint-disable-next-line no-undef
      return document.body.innerText // or any other data you want to extract
    })
    // Take a screenshot of the current page
    await page.screenshot({ path: 'test-output/page-screenshot.png' }) // Save the screenshot to a file

    // Close the Playwright browser
    await browser.close()
  } catch (error) {
    // Handle error if the request fails
    console.error(error)
  }

  return responseFromPaytrail
}

export async function callPaytrailWithCardPayment(confirmedOrder: {
  payment: { paytrailProvider: { url: string; parameters: any } }
}) {
  let responseFromPaytrail = null

  // Create HTML form dynamically with the parameters
  const createFormHTML = (
    url: string,
    parameters: { name: string; value: string | number | boolean }[]
  ) => {
    let formHTML = `<form id="paytrailForm" method="POST" action="${url}">`

    // Loop through parameters and add them as hidden inputs
    parameters.forEach((param) => {
      formHTML += `<input type="hidden" name="${param.name}" value="${param.value}"/>`
    })

    formHTML += `
      </form>
      <script type="text/javascript">
        document.getElementById('paytrailForm').submit();
      </script>
    `

    return formHTML
  }

  try {
    // Launch a Playwright browser (Chromium in this case)
    const browser = await chromium.launch({ headless: false })
    // Create a new incognito context (no session, cookies, cache)
    const context = await browser.newContext() // Incognito-like context

    // Create a new page in this incognito context
    const page = await context.newPage()

    // Create the form HTML with parameters
    const formHTML = createFormHTML(
      confirmedOrder.payment.paytrailProvider.url,
      confirmedOrder.payment.paytrailProvider.parameters
    )

    // Set the HTML content of the page (replace the default about:blank)
    await page.setContent(formHTML, { timeout: 5000 })

    // Wait for the page to submit the form and navigate
    // await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 5000 })
    // Take a screenshot of the page before entering any values
    await page.screenshot({ path: 'test-output/before-input-screenshot.png' })
    console.log('Screenshot taken before form submission')
    await page.waitForSelector('#cardNumber')
    // Fill out the form with the specified card details
    await page.fill('#cardNumber', '4153 0139 9970 0313')
    await page.fill('#expiry', '11/2026')
    await page.fill('#cvv', '313')
    // Take a screenshot of the current page
    // Take a screenshot of the page after filling the form
    await page.screenshot({ path: 'test-output/after-input-screenshot.png' })
    console.log('Screenshot taken after form submission')

    // Submit the form and wait for the navigation after the form submission
    await Promise.all([
      page.click('button[type="submit"]'), // Submit the form
      page.waitForTimeout(2000),
    ])

    await page.screenshot({ path: 'test-output/after-submit-screenshot.png' })

    await page.waitForSelector('#code')
    await page.fill('#code', '1234')
    await Promise.all([
      page.click('input[type="submit"]'), // Submit the form
      page.waitForTimeout(2000),
    ])

    await page.waitForURL(/.*success.*/)
    await page.screenshot({ path: 'test-output/success-screenshot.png' })
    responseFromPaytrail = page.url()
    // Close the Playwright browser
    await browser.close()
  } catch (error) {
    // Handle error if the request fails
    console.error(error)
  }

  return responseFromPaytrail
}

export const skipIfNotLocalTest = () => {
  // Skips test if not local development (e2e)
  if (!isLocalDevelopment) {
    /* eslint-disable jest/no-focused-tests */
    it.only('isLocalDevelopment needs to be true', () => {
      console.warn('isLocalDevelopment needs to be true')
    })
  }
}
