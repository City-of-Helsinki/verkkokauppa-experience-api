import {
  parseClientIpFromXForwardedFromHeader,
  stripPortNumberFromIp,
} from './ipParseUtil'

describe('Parse client IP address from X-Forwarded-From header values', () => {
  it('should parse the client IP from a list of IP:s', () => {
    const mockHeader = {
      'x-forwarded-from': '127.0.0.1, 127.1.2.3, 123.5.6.7:8080',
    }
    expect(
      parseClientIpFromXForwardedFromHeader(mockHeader['x-forwarded-from'])
    ).toEqual('127.0.0.1')
  })
  it('should parse the IP address from IP with port notation', () => {
    const mockHeader = {
      'x-forwarded-from': '127.0.0.2:8080',
    }
    expect(
      parseClientIpFromXForwardedFromHeader(mockHeader['x-forwarded-from'])
    ).toEqual('127.0.0.2')
  })
  it('should parse the client IP address from IP with port notation and a list of IP:s', () => {
    const mockHeader = {
      'x-forwarded-from': '127.0.0.2:8080, 127.1.2.3, 123.5.6.7:8080',
    }
    expect(
      parseClientIpFromXForwardedFromHeader(mockHeader['x-forwarded-from'])
    ).toEqual('127.0.0.2')
  })
})

describe('Strip port number from IP address with port notation', () => {
  it('should remove port definition form IP', () => {
    const ip = '194.2.4.5:8100'
    expect(stripPortNumberFromIp(ip)).toEqual('194.2.4.5')
  })
})
