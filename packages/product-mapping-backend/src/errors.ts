import {
  ExperienceError,
  ExperienceFailure,
  StatusCode,
} from '@verkkokauppa/core'

export class ProductMappingNotFound extends ExperienceError {
  constructor() {
    super({
      code: 'product-mapping-not-found',
      message: 'Product mapping not found',
      responseStatus: StatusCode.NotFound,
      logLevel: 'info',
    })
  }
}

export class GetProductMappingFailure extends ExperienceFailure {
  constructor(source: Error) {
    super({
      code: 'failed-to-get-product-mapping',
      message: 'Failed to get product mapping',
      source,
    })
  }
}

export class CreateProductMappingFailure extends ExperienceFailure {
  constructor(source: Error) {
    super({
      code: 'failed-to-create-product-mapping',
      message: 'Failed to create product mapping',
      source,
    })
  }
}
