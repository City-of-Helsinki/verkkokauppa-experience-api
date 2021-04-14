import { getPrice } from './index';
import axios from 'axios';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

describe('Test Price from backend', () => {
  it('Should throw error with no backend url set', async () => {
    process.env.PRICE_BACKEND_URL = '';
    await expect(getPrice({ id: 'test' })).rejects.toThrow('No backend URL set');
  });
  it('Should fetch correctly with backend url set', async () => {
    process.env.PRICE_BACKEND_URL = 'test.dev.hel';
    const mockData = { id: 'test', price: 123.45 };
    axiosMock.get.mockResolvedValue(mockData);
    const result = await getPrice({ id: 'test' });
    await expect(result).toBe(mockData);
  });
});