import type { RequestHandler } from 'express'
import { getProduct } from '@verkkokauppa/product-backend'
import type { CommonExperienceRequest } from '@verkkokauppa/types'
import { getPrice } from '@verkkokauppa/price-backend'
import logger from '../logger'
import { CombinedResult } from '../model/result'

export const get: RequestHandler<CommonExperienceRequest> = async (
  req,
  res
) => {
  const { id } = req.params
  const combinedResult = new CombinedResult()

  logger.debug(`Fetch product and price data for ${id}`)

  const product = getProduct({ id })
    .then((result) =>
      combinedResult.add({ value: result.data, identifier: 'product' })
    )
    .catch(() => {
      logger.error(`No product data found for ${id}`)
      res.status(404)
    })
  const pricePromise = getPrice({ id })
    .then((result) =>
      combinedResult.add({ value: result.data, identifier: 'price' })
    )
    .catch(() => {
      logger.warn(`No price data found for ${id}`)
    })
  try {
    await Promise.all([product, pricePromise])
    if (res.statusCode === 404) {
      res.send({ error: `No product data found for ${id}` })
    } else {
      res.send(combinedResult.serialize())
    }
  } catch (error) {
    logger.error(error)
    res.send({ error: error.message })
  }
}
