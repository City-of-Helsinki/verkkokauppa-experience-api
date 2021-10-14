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
import { ExperienceFailure } from '@verkkokauppa/core'

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
  configurations: { [key: string]: string }
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
