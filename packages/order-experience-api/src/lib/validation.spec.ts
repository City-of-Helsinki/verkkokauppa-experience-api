import { validateCustomer, validateItems } from './validation'

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

describe('Test Customer Validations', () => {
  it('Should validate customer correctly', async () => {
    const customer = {
      firstName: 'Test',
      lastName: 'Tester',
      email: 'test@tester.com',
      phone: '+35840123123',
    }
    const result = await validateCustomer(customer)
    expect(result).toBeTruthy()
  })
  it('Should validate faulty customer without firstName', async () => {
    const customer = {
      lastName: 'Tester',
      email: 'test@tester.com',
      phone: '+35840123123',
    }
    // @ts-ignore
    const result = await validateCustomer(customer)
    expect(result).toBeFalsy()
  })
  it('Should validate faulty customer with faulty email', async () => {
    const customer = {
      firstName: 'Test',
      lastName: 'Tester',
      email: 'faultyEMAIL',
      phone: '+35840123123',
    }
    // @ts-ignore
    const result = await validateCustomer(customer)
    expect(result).toBeFalsy()
  })
  it('Should validate faulty customer with faulty phone', async () => {
    const customer = {
      firstName: 'Test',
      lastName: 'Tester',
      email: 'test@tester.com',
      phone: '+1s4gas5das5',
    }
    // @ts-ignore
    const result = await validateCustomer(customer)
    expect(result).toBeFalsy()
  })
})
