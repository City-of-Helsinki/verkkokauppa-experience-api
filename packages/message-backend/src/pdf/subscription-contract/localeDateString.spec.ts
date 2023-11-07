import { localeDateString } from './document-definition'

describe('localeDateString', () => {
  it('should format a provided date correctly', () => {
    const inputDate = '2022-11-05T23:59:59.999Z'

    const formattedDate = localeDateString(inputDate)

    expect(formattedDate).toBe('05.11.2022')
  })

  it('should format a date in the default locale correctly', () => {
    const inputDate = '2023-10-02T23:59:59.999Z'

    const formattedDate = localeDateString(inputDate)

    expect(formattedDate).toBe('02.10.2023')
  })
})
