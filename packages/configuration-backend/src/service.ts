import axios from 'axios'
import type {
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

export const getMerchantDetailsForOrder = async (p: {
  namespace: string
}): Promise<ServiceConfiguration[]> => {
  const { namespace } = p
  const allConfiguration = await getAllPublicServiceConfiguration({ namespace })
  const merchantFields = [
    'MERCHANT_NAME',
    'MERCHANT_STREET',
    'MERCHANT_ZIP',
    'MERCHANT_CITY',
    'MERCHANT_EMAIL',
    'MERCHANT_PHONE',
    'MERCHANT_URL',
    'MERCHANT_BUSINESS_ID',
  ]
  return allConfiguration.filter((configuration) =>
    merchantFields.includes(configuration.configurationKey)
  )
}
