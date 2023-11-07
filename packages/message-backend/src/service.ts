import { formatInTimeZone } from 'date-fns-tz'

export const localeDateStringWithHelsinkiTimeZone = (datetime?: string) => {
  const date = datetime ? new Date(datetime) : new Date()
  if (!isValidDate(date)) {
    return ''
  }
  return formatInTimeZone(date, 'Europe/Helsinki', 'dd.MM.yyyy')
}
export const localeDateStringUTC = (datetime?: string) => {
  const date = datetime ? new Date(datetime) : new Date()
  if (!isValidDate(date)) {
    return ''
  }
  return formatInTimeZone(date, 'UTC', 'dd.MM.yyyy')
}

export const localeDateTimeStringWithHelsinkiTimezone = (datetime?: string) => {
  const date = datetime ? new Date(datetime) : new Date()
  if (!isValidDate(date)) {
    return ''
  }
  return formatInTimeZone(date, 'Europe/Helsinki', 'dd.MM.yyyy HH:mm')
}

export const localeTimeStringWithHelsinkiTimezone = (datetime?: string) => {
  const date = datetime ? new Date(datetime) : new Date()
  if (!isValidDate(date)) {
    return ''
  }
  return formatInTimeZone(date, 'Europe/Helsinki', 'HH:mm')
}

export const localeDateTimeStringUTC = (datetime?: string) => {
  const date = datetime ? new Date(datetime) : new Date()
  if (!isValidDate(date)) {
    return ''
  }
  return formatInTimeZone(date, 'UTC', 'dd.MM.yyyy HH:mm')
}

export const isValidDate = (date: any) =>
  date instanceof Date && date.toString() !== 'Invalid Date'
