import axios, { AxiosResponse } from 'axios';
import type { CommonBackendHandler } from '@verkkokauppa/types';

type ProductBackendResponse = {
  id: string;
  name: string;
  [key: string]: any;
};

export const getProduct: CommonBackendHandler<AxiosResponse<ProductBackendResponse>> = async (p) => {
  const { id } = p;
  if (!process.env.PRODUCT_BACKEND_URL) {
    throw new Error('No backend URL set');
  }
  const url = `${process.env.PRODUCT_BACKEND_URL}/product/get?productId=${id}`;
  return axios.get<ProductBackendResponse>(url);
};
