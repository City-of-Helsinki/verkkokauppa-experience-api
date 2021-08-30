import { ExperienceFailure } from '@verkkokauppa/core'

export class GetAllPublicServiceConfigurationFailure extends ExperienceFailure {
  constructor(source: Error) {
    super({
      code: 'failed-to-get-all-public-service-configurations',
      message: 'Failed to get all public service configurations',
      source,
    })
  }
}

export class GetPublicServiceConfigurationFailure extends ExperienceFailure {
  constructor(source: Error) {
    super({
      code: 'failed-to-get-public-service-configuration',
      message: 'Failed to get public service configuration',
      source,
    })
  }
}

export class GetAllRestrictedServiceConfigurationFailure extends ExperienceFailure {
  constructor(source: Error) {
    super({
      code: 'failed-to-get-all-restricted-service-configurations',
      message: 'Failed to get all restricted service configurations',
      source,
    })
  }
}

export class GetRestrictedServiceConfigurationFailure extends ExperienceFailure {
  constructor(source: Error) {
    super({
      code: 'failed-to-get-restricted-service-configuration',
      message: 'Failed to get restricted service configuration',
      source,
    })
  }
}
