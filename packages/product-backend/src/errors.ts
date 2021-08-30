import {
  ExperienceError,
  ExperienceFailure,
  StatusCode,
} from '@verkkokauppa/core'

export class ProductNotFoundError extends ExperienceError {
  constructor(productId: string) {
    super({
      code: 'product-not-found',
      message: `Product ${productId} not found`,
      responseStatus: StatusCode.NotFound,
      logLevel: 'info',
    })
  }
}

export class GetProductFailure extends ExperienceFailure {
  constructor(productId: string, source: Error) {
    super({
      code: 'failed-to-get-product',
      message: `Failed to get product ${productId}`,
      source,
    })
  }
}

export class CreateProductAccountingFailure extends ExperienceFailure {
  constructor(source: Error) {
    super({
      code: 'failed-to-create-product-accounting',
      message: 'Failed to create product accounting',
      source,
    })
  }
}
