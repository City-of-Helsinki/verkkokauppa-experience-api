import { getProduct } from './index';
import axios from 'axios';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

describe('Test Single Product from backend', () => {
  it('Should throw error with no backend url set', async () => {
    process.env.BACKEND_URL = '';
    await expect(getProduct({ id: 'test' })).rejects.toThrow('No backend URL set');
  });
  it('Should fetch correctly with backend url set', async () => {
    process.env.BACKEND_URL = 'test.dev.hel';
    const mockData = { id: 'test', name: 'Test' };
    axiosMock.get.mockResolvedValue(mockData);
    const result = await getProduct({ id: 'test' });
    await expect(result).toBe(mockData);
  });
});
