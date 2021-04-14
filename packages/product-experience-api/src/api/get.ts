import type { RequestHandler } from 'express';
import { getProduct } from '@verkkokauppa/product-backend';
import type { CommonExperienceRequest } from '@verkkokauppa/types';

export const get: RequestHandler<CommonExperienceRequest> = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await getProduct({ id });
    if (!product.data) {
      res.status(404).send();
    }
    res.send(product.data);
  } catch (e) {
    if (e.response.status === 404) {
      res.status(404).send({ error: 'Product not found' });
    } else {
      res.status(400).send({ error: e.message });
    }
  }
};
