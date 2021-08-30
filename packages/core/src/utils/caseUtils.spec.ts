import { toCamelCase } from './caseUtils'

describe('Test case Utils', () => {
  it('Should convert snake_case to camelCase', () => {
    const source = 'TEST_STRING'
    const destination = 'testString'
    expect(toCamelCase(source)).toBe(destination)
  })
})
