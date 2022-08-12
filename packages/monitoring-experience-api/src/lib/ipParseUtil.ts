/**
 * Parses the client IP address from the X-Forwarded-From header value.
 * There might be multiple IP:s as the value,
 * in these cases the first element represents the client and the rest are proxy IP:s.
 * The header value may be in the following formats:
 * - "127.0.0.1"
 * - "127.0.0.1:8080"
 * - "127.0.0.1, 127.0.0.2:8080"
 * @param ip
 * @return clientIp Client IP address
 */
export const parseClientIpFromXForwardedFromHeader = (
  ip: string | string[]
) => {
  let clientIp
  if (Array.isArray(ip)) {
    clientIp = ip[0]
  } else {
    clientIp = ip.split(', ')[0]
  }

  if (clientIp) {
    clientIp = stripPortNumberFromIp(clientIp)
  }
  return clientIp
}

/**
 * Removes the port notation from IP address.
 * @param ip IP address as <ADDRESS>:<PORT>
 */
export const stripPortNumberFromIp = (ip: string) => {
  if (ip.includes(':')) {
    return ip.split(':')[0]
  } else {
    return ip
  }
}
