export const parseOrderIdFromRedirect = (p: { query: any }) => {
  const { query } = p

  const result = query.ORDER_NUMBER?.toString().split('_')
  return result[0]
}
