import axios from 'axios'
import type {
  Configuration,
  Merchant,
  MerchantConfigurationKeys,
  MerchantKeys,
  Namespace,
  OrderItem,
  PublicServiceConfigurationKeys,
  RestrictedServiceConfigurationKeys,
  ServiceConfiguration,
} from './types'
import {
  GetAllPublicServiceConfigurationFailure,
  GetAllRestrictedServiceConfigurationFailure,
  GetPublicServiceConfigurationFailure,
  GetRestrictedServiceConfigurationFailure,
} from './errors'
import {
  ExperienceError,
  ExperienceFailure,
  StatusCode,
} from '@verkkokauppa/core'

export const getAllPublicServiceConfiguration = async (p: {
  namespace: string
}): Promise<ServiceConfiguration[]> => {
  const { namespace } = p
  if (!process.env.CONFIGURATION_BACKEND_URL) {
    throw new Error('No configuration backend URL set')
  }
  const url = `${process.env.CONFIGURATION_BACKEND_URL}/public/getAll`
  try {
    const result = await axios.get<ServiceConfiguration[]>(url, {
      params: { namespace },
    })
    return result.data
  } catch (e) {
    throw new GetAllPublicServiceConfigurationFailure(e)
  }
}

export const getPublicServiceConfiguration = async (p: {
  namespace: string
  key: keyof PublicServiceConfigurationKeys
}): Promise<ServiceConfiguration> => {
  const { namespace, key } = p
  if (!process.env.CONFIGURATION_BACKEND_URL) {
    throw new Error('No configuration backend URL set')
  }
  const url = `${process.env.CONFIGURATION_BACKEND_URL}/public/get`
  try {
    const result = await axios.get<ServiceConfiguration>(url, {
      params: { namespace, key },
    })
    return result.data
  } catch (e) {
    throw new GetPublicServiceConfigurationFailure(e)
  }
}

export const getAllRestrictedServiceConfiguration = async (p: {
  namespace: string
}): Promise<ServiceConfiguration[]> => {
  const { namespace } = p
  if (!process.env.CONFIGURATION_BACKEND_URL) {
    throw new Error('No configuration backend URL set')
  }
  const url = `${process.env.CONFIGURATION_BACKEND_URL}/restricted/getAll`
  try {
    const result = await axios.get<ServiceConfiguration[]>(url, {
      params: { namespace },
    })
    return result.data
  } catch (e) {
    throw new GetAllRestrictedServiceConfigurationFailure(e)
  }
}

export const getRestrictedServiceConfiguration = async (p: {
  namespace: string
  key: keyof RestrictedServiceConfigurationKeys
}): Promise<ServiceConfiguration> => {
  const { namespace, key } = p
  if (!process.env.CONFIGURATION_BACKEND_URL) {
    throw new Error('No configuration backend URL set')
  }
  const url = `${process.env.CONFIGURATION_BACKEND_URL}/restricted/get`
  try {
    const result = await axios.get<ServiceConfiguration>(url, {
      params: { namespace, key },
    })
    return result.data
  } catch (e) {
    throw new GetRestrictedServiceConfigurationFailure(e)
  }
}

export const getMerchantDetailsForOrder = async (order: {
  namespace: string
  items: OrderItem[]
}) => {
  const { namespace } = order
  let merchantId = parseMerchantIdFromFirstOrderItem(order) || ''
  return getMerchantDetailsWithNamespaceAndMerchantId(namespace, merchantId)
}

export const getReducedServiceConfigurationsForNamespace = async (
  namespace: string
) => {
  const allConfiguration =
    (await getAllPublicServiceConfiguration({ namespace })) || []

  return ((allConfiguration as unknown) as Array<ServiceConfiguration>).reduce(
    (acc, cur) => {
      const { configurationKey, configurationValue } = cur

      if (getAllowedKeysToMerchant().includes(configurationKey)) {
        acc[configurationKey] = configurationValue
      }
      return acc
    },
    {} as {
      [Key in
        | keyof PublicServiceConfigurationKeys
        | keyof RestrictedServiceConfigurationKeys]: string
    }
  )
}

export const getMerchantDetailsWithNamespaceAndMerchantId = async (
  namespace: string,
  merchantId: string
) => {
  const reducedServiceConfigurations = await getReducedServiceConfigurationsForNamespace(
    namespace
  )

  try {
    const reducedMerchantConfigurations: MerchantKeys | null = await getMerchantValues(
      namespace,
      merchantId
    )
    if (reducedMerchantConfigurations) {
      return {
        ...reducedServiceConfigurations,
        ...reducedMerchantConfigurations, // Overrides values in service configurations
      }
    }
  } catch (e) {
    console.log(e)
  }

  return {
    ...reducedServiceConfigurations,
  }
}

export const createPublicServiceConfigurations = async (p: {
  namespace: string
  configurations: { [key: string]: string | undefined }
}): Promise<ServiceConfiguration[]> => {
  if (!process.env.CONFIGURATION_BACKEND_URL) {
    throw new Error('No configuration backend URL set')
  }
  const url = `${process.env.CONFIGURATION_BACKEND_URL}/public/create-batch`
  try {
    const res = await axios.post(url, p)
    return res.data
  } catch (e) {
    throw new ExperienceFailure({
      code: 'failed-to-create-public-service-configurations',
      message: 'Failed to create public service configurations',
      source: e,
    })
  }
}

export const createMerchant = async (p: {
  namespace: string
  merchantKeys: MerchantKeys
}): Promise<Merchant> => {
  if (!process.env.MERCHANT_CONFIGURATION_BACKEND_URL) {
    throw new Error('No configuration backend URL set')
  }

  const configurationsDto: Configuration[] = []

  Object.entries(p.merchantKeys).forEach(([key, value]) => {
    configurationsDto.push({
      value: value || '',
      key: key || '',
      restricted: false,
    })
  })

  const createMerchantPayload = {
    configurations: configurationsDto,
    namespace: p.namespace,
  }

  const url = `${process.env.MERCHANT_CONFIGURATION_BACKEND_URL}/merchant/upsert`
  try {
    const res = await axios.post(url, createMerchantPayload)
    return res.data
  } catch (e) {
    throw new ExperienceFailure({
      code: 'failed-to-create-merchant',
      message: 'Failed to create/update merchant configurations',
      source: e,
    })
  }
}

export const updateMerchant = async (merchant: Merchant): Promise<Merchant> => {
  if (!process.env.MERCHANT_CONFIGURATION_BACKEND_URL) {
    throw new Error('No configuration backend URL set')
  }

  const url = `${process.env.MERCHANT_CONFIGURATION_BACKEND_URL}/merchant/upsert`
  try {
    const res = await axios.post(url, merchant)
    return res.data
  } catch (e) {
    throw new ExperienceFailure({
      code: 'failed-to-update-merchant',
      message: 'Failed to update merchant configurations',
      source: e,
    })
  }
}

export const getNamespaceModel = async (
  namespace: string
): Promise<Namespace> => {
  if (!process.env.MERCHANT_CONFIGURATION_BACKEND_URL) {
    throw new Error('No configuration backend URL set')
  }

  const url = `${process.env.MERCHANT_CONFIGURATION_BACKEND_URL}/namespace/get?namespace=${namespace}`
  try {
    const res = await axios.get(url)
    return res.data
  } catch (e) {
    throw new ExperienceFailure({
      code: 'failed-to-get-namespace',
      message: 'Failed to get namespace configurations',
      source: e,
    })
  }
}

export const getMerchantModels = async (
  namespace: string
): Promise<Merchant[]> => {
  if (!process.env.MERCHANT_CONFIGURATION_BACKEND_URL) {
    throw new Error('No configuration backend URL set')
  }

  const url = `${process.env.MERCHANT_CONFIGURATION_BACKEND_URL}/merchant/list-by-namespace?namespace=${namespace}`
  try {
    const res = await axios.get(url)
    return res.data
  } catch (e) {
    throw new ExperienceFailure({
      code: 'failed-to-list-merchants-by-namespace',
      message: 'Failed to get list of merchants by namespace',
      source: e,
    })
  }
}

const getAllowedKeysToMerchant = () => [
  'merchantName',
  'merchantStreet',
  'merchantZip',
  'merchantCity',
  'merchantEmail',
  'merchantPhone',
  'merchantUrl',
  'merchantTermsOfServiceUrl',
  'merchantBusinessId',
  'merchantShopId',
]

export const getMerchantValues = async (
  namespace: string,
  merchantId: string | null
): Promise<MerchantKeys | null> => {
  if (!process.env.MERCHANT_API_URL) {
    throw new Error('No merchant experience URL set')
  }

  if (!merchantId) {
    throw new Error('Merchant was null/empty')
  }

  if (!namespace) {
    throw new Error('Namespace was null/empty')
  }
  // Route is /merchant/:namespace/:merchantId
  const url = `${process.env.MERCHANT_API_URL}${namespace}/${merchantId}`

  try {
    const res = await axios.get<ServiceConfiguration>(url)
    if (res.data) {
      return (Object.entries(res.data) as Array<
        [keyof MerchantConfigurationKeys, string]
      >).reduce((acc, [configurationKey, configurationValue]) => {
        if (getAllowedKeysToMerchant().includes(configurationKey)) {
          acc[configurationKey] = configurationValue
        }
        return acc
      }, {} as { [Key in keyof MerchantConfigurationKeys]: string })
    }
    return null
  } catch (e) {
    throw new ExperienceFailure({
      code: 'failed-to-get-merchant-by-namespace-and-merchant-id',
      message:
        'Failed to get list of merchant values by namespace and merchant id',
      source: e,
    })
  }
}

export const getAllConfigurationKeys = async (): Promise<Merchant[]> => {
  if (!process.env.MERCHANT_CONFIGURATION_BACKEND_URL) {
    throw new Error('No merchant configuration backend URL set')
  }

  const url = `${process.env.MERCHANT_CONFIGURATION_BACKEND_URL}/config/keys/getAll`
  try {
    const res = await axios.get(url)
    return res.data
  } catch (e) {
    throw new ExperienceFailure({
      code: 'failed-to-list-configuration-keys',
      message:
        'Failed to get list of configuration keys for namespace, merchant and platform.',
      source: e,
    })
  }
}

const isApiKeyValid = async (p: {
  namespace: string
  apiKey: string
}): Promise<boolean> => {
  const { namespace, apiKey: token } = p
  if (!process.env.CONFIGURATION_BACKEND_URL) {
    throw new Error('No configuration backend URL set')
  }
  const url = `${process.env.CONFIGURATION_BACKEND_URL}/api-access/validate`
  try {
    const res = await axios.get(url, {
      params: { namespace, token },
    })
    return res.data
  } catch (e) {
    throw new ExperienceFailure({
      code: 'failed-to-validate-api-key',
      message: 'Failed to validate api key',
      source: e,
    })
  }
}

export const validateApiKey = async (p: {
  namespace: string
  apiKey: string
}): Promise<void> => {
  const isValid = await isApiKeyValid(p)
  if (!isValid) {
    throw new ExperienceError({
      code: 'api-key-validation-failed',
      message: 'invalid api key',
      responseStatus: StatusCode.Forbidden,
      logLevel: 'info',
    })
  }
}

export const validateAdminApiKey = async (p: {
  apiKey: string
}): Promise<void> => {
  const { apiKey } = p
  return validateApiKey({ namespace: 'admin', apiKey })
}

export const getSubscriptionTermsOfServiceBinary = async (p: {
  namespace: string
}): Promise<string> => {
  const { namespace } = p
  try {
    const configuration = await getPublicServiceConfiguration({
      namespace,
      key: 'merchantSubscriptionTermsOfServiceUrl',
    })
    const tos = await axios.get(configuration.configurationValue, {
      responseType: 'arraybuffer',
    })
    return (tos.data as Buffer).toString('base64')
  } catch (e) {
    throw new ExperienceFailure({
      code: 'failed-to-get-subscription-terms-of-service',
      message: 'Failed to get subscription terms of service',
      source: e,
    })
  }
}

export const parseMerchantIdFromFirstOrderItem = (order: {
  items: OrderItem[]
}) => {
  let merchantId = null
  if (
    order !== undefined &&
    Array.isArray(order.items) &&
    order.items[0] !== undefined &&
    order.items[0].merchantId != undefined
  ) {
    merchantId = order?.items[0]?.merchantId || null
  }
  return merchantId
}
