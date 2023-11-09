import {
  localeDateStringUTC,
  localeDateTimeStringWithHelsinkiTimezone,
} from '../../service'

describe('localeDateString', () => {
  it('should format a provided date correctly', () => {
    const inputDate = '2022-11-05T23:59:59.999Z'

    const formattedDate = localeDateStringUTC(inputDate)

    expect(formattedDate).toBe('05.11.2022')
  })

  it('should format a date in the default locale correctly', () => {
    const inputDate = '2023-10-02T23:59:59.999Z'

    const formattedDate = localeDateStringUTC(inputDate)

    expect(formattedDate).toBe('02.10.2023')
  })

  it("should add timezone 'Europe/Helsinki' to timestamp", () => {
    const inputDate = '2023-10-02T00:00:00.000Z'

    const formattedDate = localeDateTimeStringWithHelsinkiTimezone(inputDate)

    expect(formattedDate).toBe('02.10.2023 03:00')
  })
})
