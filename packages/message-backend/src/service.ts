import { formatInTimeZone } from 'date-fns-tz'

export const localeDateStringWithHelsinkiTimeZone = (datetime?: string) => {
  const date = datetime ? new Date(datetime) : new Date()
  return formatInTimeZone(date, 'Europe/Helsinki', 'dd.MM.yyyy')
}
export const localeDateStringUTC = (datetime?: string) => {
  const date = datetime ? new Date(datetime) : new Date()
  return formatInTimeZone(date, 'UTC', 'dd.MM.yyyy')
}

export const localeDateTimeStringWithHelsinkiTimezone = (datetime?: string) => {
  const date = datetime ? new Date(datetime) : new Date()
  return formatInTimeZone(date, 'Europe/Helsinki', 'dd.MM.yyyy HH:mm:ss')
}

export const localeDateTimeStringUTC = (datetime?: string) => {
  const date = datetime ? new Date(datetime) : new Date()
  return formatInTimeZone(date, 'UTC', 'dd.MM.yyyy HH:mm:ss')
}
