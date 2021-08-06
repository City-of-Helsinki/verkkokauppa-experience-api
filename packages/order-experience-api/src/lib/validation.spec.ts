import { validateItems } from './validation'

describe('Test Order Validations', () => {
  it('Should validate order item correctly', async () => {
    const items = [
      {
        productId: '123',
        productName: 'Name',
        quantity: 1,
        unit: 'pcs',
        rowPriceNet: '100',
        rowPriceVat: '24',
        rowPriceTotal: '124',
      },
    ]
    const result = await validateItems({ items })
    expect(result).toBeTruthy()
  })
  it('Should validate faulty order item correctly', async () => {
    const items = [
      {
        productId: '123',
        productName: 'Name',
        quantity: 1,
        unit: 'pcs',
        rowPriceNet: undefined,
        rowPriceVat: undefined,
        rowPriceTotal: undefined,
      },
    ]
    // @ts-ignore
    const result = await validateItems({ items })
    expect(result).toBeFalsy()
  })
})
