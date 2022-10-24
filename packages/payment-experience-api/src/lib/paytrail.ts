export const parseOrderIdFromPaytrailRedirect = (p: { query: any }) => {
  const { query } = p

  const result = query['checkout-stamp']?.toString().split('_')
  return result[0]
}
