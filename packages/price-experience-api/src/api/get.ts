import type { RequestHandler } from 'express'
import type { CommonExperienceRequest } from '@verkkokauppa/types'
import { getPrice } from '@verkkokauppa/price-backend'
import logger from '../logger'

export const get: RequestHandler<CommonExperienceRequest> = async (
  req,
  res
) => {
  const { id } = req.params

  logger.debug(`Fetch price data for product ${id}`)

  try {
    const prices = await getPrice({ id })
    if (!prices.data) {
      res.status(404).send()
    }
    res.send(prices.data)
  } catch (e) {
    logger.error(e)
    if (e.response.status === 404) {
      res.status(404).send({ error: `Price for product ${id} not found` })
    } else {
      res.status(400).send({ error: e.message })
    }
  }
}
