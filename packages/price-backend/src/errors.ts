import {
  ExperienceError,
  ExperienceFailure,
  StatusCode,
} from '@verkkokauppa/core'

export class PriceNotFoundError extends ExperienceError {
  constructor(productId: string) {
    super({
      code: 'price-not-found',
      message: `Price not found for product ${productId}`,
      responseStatus: StatusCode.NotFound,
      logLevel: 'info',
    })
  }
}

export class GetPriceFailure extends ExperienceFailure {
  constructor(productId: string, source: Error) {
    super({
      code: 'failed-to-get-price',
      message: `Failed to get price for product ${productId}`,
      source,
    })
  }
}
