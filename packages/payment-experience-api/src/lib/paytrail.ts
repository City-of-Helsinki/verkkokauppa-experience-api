export const parseOrderIdFromPaytrailRedirect = (p: { query: any }) => {
  return parseUuidFromPaytrailRedirectCheckoutStamp(p)
}

export const parseRefundIdFromPaytrailRefundCallbackUrl = (p: {
  query: any
}) => {
  return parseUuidFromPaytrailRedirectCheckoutStamp(p)
}

export const parseUuidFromPaytrailRedirectCheckoutStamp = (p: {
  query: any
}) => {
  const { query } = p

  const result = query['checkout-stamp']?.toString()?.split('_')
  return result?.[0]
}
