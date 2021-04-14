import type { RequestHandler } from 'express';
import { getProduct } from '@verkkokauppa/product-backend';
import type { CommonExperienceRequest } from '@verkkokauppa/types';
import { getPrice } from '@verkkokauppa/price-backend';
import logger from '../logger';

export const get: RequestHandler<CommonExperienceRequest> = async (req, res) => {
  try {
    const { id } = req.params;

    const productPromise = getProduct({ id });
    const pricePromise = getPrice({ id });
    logger.debug(`Fetch product and price data for ${id}`);
    await Promise.all([productPromise, pricePromise]).then((result) => {
      const product = result[0];
      const price = result[1];
      if (!product.data) {
        logger.error(`No product data found for ${id}`);
        res.status(404).send();
      }
      if (price.data) {
        res.send({ ...product.data, ...price.data });
      } else {
        logger.warn(`No price data found for ${id}`);
        res.send(product.data);
      }
    });
  } catch (e) {
    if (e.response && e.response.status === 404) {
      res.status(404).send({ error: 'Product not found' });
    } else {
      logger.error(e);
      res.status(400).send({ error: e.message });
    }
  }
};
