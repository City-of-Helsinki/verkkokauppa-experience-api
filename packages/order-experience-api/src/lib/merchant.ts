import { caseUtils } from '@verkkokauppa/core'
import type { ServiceConfiguration } from '@verkkokauppa/configuration-backend'

export const transformConfigurationToMerchant = (p: ServiceConfiguration[]) => {
  return p.reduce<any>((acc, current) => {
    acc[caseUtils.toCamelCase(current.configurationKey)] =
      current.configurationValue
    return acc
  }, {})
}
