import axios from 'axios'
import type {
  MerchantConfigurationKeys,
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

export const getMerchantDetailsForOrder = async (p: { namespace: string }) => {
  const { namespace } = p
  const allConfiguration = await getAllPublicServiceConfiguration({ namespace })

  return allConfiguration.reduce((acc, cur) => {
    const { configurationKey: k, configurationValue } = cur
    if (
      k === 'merchantName' ||
      k === 'merchantStreet' ||
      k === 'merchantZip' ||
      k === 'merchantCity' ||
      k === 'merchantEmail' ||
      k === 'merchantPhone' ||
      k === 'merchantUrl' ||
      k === 'merchantTermsOfServiceUrl' ||
      k === 'merchantBusinessId'
    ) {
      acc[k] = configurationValue
    }
    return acc
  }, {} as { [Key in keyof MerchantConfigurationKeys]: string })
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
