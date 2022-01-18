// Example timestamp string 20210901-05184
export const parseTimestamp = (date: string) => {
  const year = date.substring(0, 4)
  const month = date.substring(4, 6)
  const day = date.substring(6, 8)
  const hours = date.substring(9, 11)
  const minutes = date.substring(11, 13)
  const seconds = date.substring(13, 15)

  // Minus one because js month starts at 0 not 01.
  return new Date(Date.UTC(+year, +month - 1, +day, +hours, +minutes, +seconds))
}
