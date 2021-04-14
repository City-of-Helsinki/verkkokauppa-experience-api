import axios, { AxiosResponse } from 'axios';
import type { CommonBackendHandler } from '@verkkokauppa/types';

type PriceBackendResponse = {
  id: string;
  price: number;
};

export const getPrice: CommonBackendHandler<AxiosResponse<PriceBackendResponse>> = async (p) => {
  const { id } = p;
  if (!process.env.PRICE_BACKEND_URL) {
    throw new Error('No backend URL set');
  }
  const url = `${process.env.PRICE_BACKEND_URL}/price/get?productId=${id}`;
  return axios.get<PriceBackendResponse>(url);
};
