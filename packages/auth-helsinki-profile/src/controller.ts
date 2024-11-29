import {
  AbstractController,
  ExperienceError,
  RequestValidationError,
  StatusCode,
  UnknownRequest
} from '@verkkokauppa/core'
import { JwksClient } from 'jwks-rsa'
import { JwtHeader, JwtPayload, SigningKeyCallback, verify } from 'jsonwebtoken'


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
      const authServerType = req.headers['x-auth-server-type'] as 'KEYCLOAK' | 'TUNNISTAMO'

      if (!authorization) {
        if (!authenticationRequired) {
          return super.validateRequest(req)
        }
        throw new RequestValidationError('headers.authorization is a required field')
      }
      const [ scheme, token ] = authorization.split(' ')
      if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) {
        throw new RequestValidationError('headers.authorization is not in correct format: Bearer [token]')
      }

      // Base case to be tunnistamo (old auth service)
      if (authServerType !== 'KEYCLOAK') {
        const jwks = new JwksClient({
          rateLimit: true,
          jwksRequestsPerMinute: 10,
          jwksUri: process.env.HEL_PROFILE_JWKS_URI!,
        })
        const claims: JwtPayload = await new Promise((resolve, reject) => {
          const getSigningKey = (header: JwtHeader, cb: SigningKeyCallback) => {
            jwks.getSigningKey(header.kid, (err, key) => {
              if (err) {
                return cb(err)
              }
              return cb(null, key.getPublicKey())
            })
          }
          verify(token, getSigningKey, {
            algorithms: [ 'RS256' ],
            issuer: process.env.HEL_PROFILE_ISSUER,
            audience: process.env.HEL_PROFILE_AUDIENCE
          }, (err, decoded) => {
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

      // New case for keycloak (tunnistus)
      if (authServerType === 'KEYCLOAK') {
        const issuer = process.env.HEL_KEYCLOAK_PROFILE_ISSUER
        const jwks = new JwksClient({
          rateLimit: true,
          jwksRequestsPerMinute: 20,
          jwksUri: `${issuer}/protocol/openid-connect/certs`,
        })
        const claims: JwtPayload = await new Promise((resolve, reject) => {
          const getSigningKey = (header: JwtHeader, cb: SigningKeyCallback) => {
            jwks.getSigningKey(header.kid, (err, key) => {
              if (err) {
                return cb(err)
              }
              return cb(null, key.getPublicKey())
            })
          }
          verify(token, getSigningKey, {
            algorithms: [ 'RS256' ],
            issuer: issuer,
            audience: process.env.HEL_KEYCLOAK_PROFILE_AUDIENCE || ''
          }, (err, decoded) => {
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

            // Check `amr` claim for all required values
            const expectedAmrValues = (process.env.HEL_KEYCLOAK_PROFILE_AMR || '').split(',').map(value => value.trim())

            if (!Array.isArray(decoded.amr)) {
              return reject(
                experienceError('Token validation failed: `amr` claim is missing or not an array.')
              )
            }

            // Ensure all required `amr` values are present in the token's `amr` claim
            const allAmrValuesMatch = expectedAmrValues.every(requiredAmr => decoded.amr.includes(requiredAmr))

            if (!allAmrValuesMatch) {
              return reject(
                experienceError(
                  `Token validation failed: Not all required 'amr' values are present. Expected: [${expectedAmrValues.join(
                    ', '
                  )}]`
                )
              )
            }

            return resolve(decoded)
          })
        })

        req.headers.user = claims.sub

        return super.validateRequest(req)
      }

      throw new RequestValidationError('headers.X-Auth-Server-Type is a required field')

    }
  }

  return AuthenticationController
}
