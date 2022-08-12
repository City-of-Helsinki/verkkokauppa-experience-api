import type { AbstractController, UnknownRequest } from '@verkkokauppa/core'
const ipRangeCheck = require('ip-range-check')
import { IpAddressValidationError } from '../errors'
import { parseClientIpFromXForwardedFromHeader } from '../lib/ipParseUtil'

export const withIpWhitelistValidation = <
  TController extends new (...args: any[]) => AbstractController
>(
  Controller: TController
): TController => {
  abstract class IpAddressWhitelistValidationController extends Controller {
    protected async validateRequest(req: UnknownRequest) {
      const validIps = process.env.ROUTE_PUBLIC_MONITORING_IP_WHITELIST
        ? process.env.ROUTE_PUBLIC_MONITORING_IP_WHITELIST.split(' ')
        : ['127.0.0.1']

      const requestIp =
        req.headers['x-forwarded-for'] || req.socket?.remoteAddress

      if (!requestIp) {
        throw new IpAddressValidationError('No IP found to validate')
      }

      let parsedClientIp = parseClientIpFromXForwardedFromHeader(requestIp)

      if (parsedClientIp && ipRangeCheck(parsedClientIp, validIps)) {
        return super.validateRequest(req)
      }

      console.log('IP is not whitelisted: ' + requestIp)
      throw new IpAddressValidationError('IP is not whitelisted')
    }
  }
  return IpAddressWhitelistValidationController
}
