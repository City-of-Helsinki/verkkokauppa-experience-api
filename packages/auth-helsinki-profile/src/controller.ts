import {
  AbstractController,
  UnknownRequest,
  RequestValidationError,
  ExperienceError,
  StatusCode
} from '@verkkokauppa/core'
import { JwksClient } from 'jwks-rsa'
import { verify, JwtHeader, SigningKeyCallback, JwtPayload } from 'jsonwebtoken'

const jwks = new JwksClient({
  rateLimit: true,
  jwksRequestsPerMinute: 10,
  jwksUri: process.env.HEL_PROFILE_JWKS_URI!,
})

export const withAuthentication = <
  // eslint-disable-next-line prettier/prettier
  TController extends abstract new (...args: any[]) => AbstractController
>(
  Controller: TController,
  authenticationRequired = false,
): TController => {
  abstract class AuthenticationController extends Controller {
    protected async validateRequest(req: UnknownRequest) {
      const authorization = req.headers.authorization
      if (!authorization) {
        if (!authenticationRequired) {
          return super.validateRequest(req)
        }
        throw new RequestValidationError('headers.authorization is a required field')
      }
      const [scheme, token] = authorization.split(' ')
      if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) {
        throw new RequestValidationError('headers.authorization is not in correct format: Bearer [token]')
      }

      const claims: JwtPayload = await new Promise((resolve, reject) => {
        const getSigningKey = (header: JwtHeader, cb: SigningKeyCallback) => {
          jwks.getSigningKey(header.kid, (err, key) => {
            if (err) {
              return cb(err)
            }
            return cb(null, key.getPublicKey())
          })
        }
        verify(token, getSigningKey,{ algorithms: ['RS256'], issuer: process.env.HEL_PROFILE_ISSUER }, (err, decoded) => {
          const experienceError = (message: string) => new ExperienceError({
            code: 'authentication-failed',
            message: message,
            responseStatus: StatusCode.Forbidden,
            logLevel: 'info',
          })
          if (err) {
            return reject(experienceError(err.message))
          }
          if (!decoded?.sub) {
            return reject(experienceError('jwt subject missing'))
          }
          return resolve(decoded)
        })
      })

      req.headers.user = claims.sub

      return super.validateRequest(req)
    }
  }
  return AuthenticationController
}
