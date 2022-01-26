import {
  customerSchema,
  itemsSchema,
  validateCustomer,
  validateItems,
} from './validation'

describe('Test Order Validations', () => {
  it('validateItems should call isValid of itemsSchema', async () => {
    const spy = jest.spyOn(itemsSchema, 'isValid')
    await validateItems({ items: [] })
    expect(spy).toHaveBeenCalledTimes(1)
  })
  it('itemsSchema should validate order item correctly', async () => {
    const items = [
      {
        productId: '123',
        productName: 'Name',
        productLabel: 'Product Label',
        productDescription: 'Product Description',
        quantity: 2,
        unit: 'pcs',
        rowPriceNet: '100',
        rowPriceVat: '24',
        rowPriceTotal: '124',
        priceNet: '50',
        priceGross: '62',
        priceVat: '12',
        vatPercentage: '24',
      },
    ]
    const result = await itemsSchema.isValid(items)
    expect(result).toEqual(true)
  })
  it('itemsSchema should validate faulty order item correctly', async () => {
    const errors = [
      '[0].productId is a required field',
      '[0].productName is a required field',
      '[0].quantity is a required field',
      '[0].unit is a required field',
      '[0].rowPriceNet is a required field',
      '[0].rowPriceVat is a required field',
      '[0].rowPriceTotal is a required field',
      '[0].priceNet is a required field',
      '[0].priceGross is a required field',
      '[0].priceVat is a required field',
      '[0].vatPercentage is a required field',
    ]

    await expect(
      itemsSchema.validate([{}], { abortEarly: false })
    ).rejects.toMatchObject({ errors })
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
  it('Should validate customer phone', async () => {
    const customer = {
      firstName: 'Test',
      lastName: 'Tester',
      email: 'test@tester.com',
    }
    expect(customerSchema.validateSync(customer)).toMatchObject({ phone: '' })
    expect(
      customerSchema.validateSync({ ...customer, phone: '' })
    ).toMatchObject({ phone: '' })
    expect(
      customerSchema.validateSync({ ...customer, phone: ' ' })
    ).toMatchObject({ phone: '' })
    expect(
      customerSchema.validateSync({ ...customer, phone: '+35840123123' })
    ).toMatchObject({ phone: '+35840123123' })
    await expect(
      customerSchema.validate({ ...customer, phone: '+1s4gas5das5' })
    ).rejects.toThrow()
  })
})
