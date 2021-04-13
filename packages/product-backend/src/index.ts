import axios, { AxiosResponse } from 'axios';
type ProductBackendRequest = {
  id: string;
};
type ProductBackendResponse = {
  id: string;
  name: string;
};

export const getProduct = async (p: ProductBackendRequest): Promise<AxiosResponse<ProductBackendResponse>> => {
  const { id } = p;
  if (!process.env.BACKEND_URL) {
    throw new Error('No backend URL set');
  }
  const url = `${process.env.BACKEND_URL}/product/get?productId=${id}`;
  return axios.get<ProductBackendResponse>(url);
};
