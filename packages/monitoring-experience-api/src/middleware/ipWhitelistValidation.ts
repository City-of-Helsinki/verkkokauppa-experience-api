import { IpAddressValidationError } from '../errors'
import type {
  AbstractController,
  UnknownRequest
} from '@verkkokauppa/core'

export const withIpWhitelistValidation = <
    // eslint-disable-next-line prettier/prettier
    TController extends abstract new (...args: any[]) => AbstractController
    >(
    Controller: TController
): TController => {
  abstract class IpAddressWhitelistValidationController extends Controller {
    protected async validateRequest(req: UnknownRequest) {
      const validIps = process.env.ROUTE_PUBLIC_MONITORING_IP_WHITELIST
          ? process.env.ROUTE_PUBLIC_MONITORING_IP_WHITELIST.split(' ')
          : ['127.0.0.1']

      let requestClientIp =
          req.headers['x-forwarded-for'] || req.socket?.remoteAddress

      if (!requestClientIp) {
        throw new IpAddressValidationError('No IP found to validate')
      }

      if (requestClientIp && Array.isArray(requestClientIp)) {
        requestClientIp = requestClientIp[0]
      }

      if (!!requestClientIp && validIps.includes(requestClientIp)) {
        return super.validateRequest(req)
      } else {
        console.log('IP is not whitelisted: ' + requestClientIp)
        throw new IpAddressValidationError(
            'IP is not whitelisted'
        )
      }
    }
  }
  return IpAddressWhitelistValidationController
}
