const jwksUri = 'TEST_JWKS_URI'
const audience = 'TEST_AUDIENCE'
const issuer = 'TEST_ISSUER'
process.env.HEL_PROFILE_JWKS_URI = jwksUri
process.env.HEL_PROFILE_AUDIENCE = audience
process.env.HEL_PROFILE_ISSUER = issuer

jest.mock('jwks-rsa')
jest.mock('jsonwebtoken')

const jwksGetSigningKeyMock = jest.fn()
const jwksClientConstructorMock = require('jwks-rsa').JwksClient.mockImplementation(
  () => ({
    getSigningKey: jwksGetSigningKeyMock,
  })
)

const sub = 'abc12345'

const verifyMock = require('jsonwebtoken').verify.mockImplementation(
  (
    _token: any,
    _signingKey: any,
    _options: any,
    cb: (err: any, decoded: any) => any
  ) => cb(null, { sub })
)

import {
  AbstractController,
  ExperienceError,
  RequestValidationError,
} from '@verkkokauppa/core'
import { promisify } from 'util'

let withAuthentication: any
jest.isolateModules(() => {
  withAuthentication = require('./controller').withAuthentication
})

class TestController extends AbstractController {
  requestSchema = null

  async validateRequest(req: any) {
    return req
  }

  protected async implementation(_req: any, _res: any): Promise<void> {}
}

const superSpy = jest.spyOn(TestController.prototype, 'validateRequest')

const mockReq = (headers: object) =>
  ({
    headers,
    get: () => ({}),
  } as any)

const controller: TestController = new (withAuthentication(TestController))()

beforeEach(() => {
  jest.clearAllMocks()
})

const authenticationError = () =>
  new ExperienceError({
    code: 'authentication-failed',
    message: '',
    responseStatus: 403,
    logLevel: 'info',
  })

describe('AuthenticationController validateRequest', () => {
  describe('missing authorization header', () => {
    it('should return validated request', async () => {
      const req = mockReq({})
      const res = await controller.validateRequest(req)
      expect(superSpy).toHaveBeenCalledTimes(1)
      expect(superSpy.mock.calls[0]![0]).toBe(req)
      expect(res).toBe(req)
    })
    it('should throw request validation error when authentication is required', async () => {
      const controller = new (withAuthentication(TestController, true))()
      await expect(controller.validateRequest(mockReq({}))).rejects.toThrow(
        new RequestValidationError('')
      )
      expect(superSpy).toHaveBeenCalledTimes(0)
    })
  })
  it('should throw for incorrect authentication scheme', async () => {
    await expect(
      controller.validateRequest(mockReq({ authorization: 'Basic A' }))
    ).rejects.toThrow(new RequestValidationError(''))
  })
  it('should throw for missing token', async () => {
    await expect(
      controller.validateRequest(mockReq({ authorization: 'Bearer' }))
    ).rejects.toThrow(new RequestValidationError(''))
  })
  it('should return validated request', async () => {
    const req = mockReq({ authorization: 'Bearer A', k1: 'v1' })
    const res = await controller.validateRequest(req)
    expect(superSpy).toHaveBeenCalledTimes(1)
    expect(superSpy.mock.calls[0]![0]).toBe(req)
    expect(res).toMatchObject(req)
  })
  it('should set jwt sub in user header', async () => {
    const res = await controller.validateRequest(
      mockReq({ authorization: 'Bearer A', user: 'u1' })
    )
    expect(res.headers.user).toEqual(sub)
  })
  it('should throw for missing jwt sub', async () => {
    verifyMock.mockImplementationOnce(
      (
        _token: any,
        _signingKey: any,
        _options: any,
        cb: (err: any, decoded: any) => any
      ) => cb(null, {})
    )
    await expect(
      controller.validateRequest(mockReq({ authorization: 'Bearer A' }))
    ).rejects.toThrow(authenticationError())
  })
  it('should throw for failed token verification', async () => {
    verifyMock.mockImplementationOnce(
      (
        _token: any,
        _signingKey: any,
        _options: any,
        cb: (err: any, decoded: any) => any
      ) => cb(new Error(), {})
    )
    await expect(
      controller.validateRequest(mockReq({ authorization: 'Bearer A' }))
    ).rejects.toThrow(authenticationError())
  })
  it('should verify token', async () => {
    await controller.validateRequest(mockReq({ authorization: 'Bearer A' }))
    expect(verifyMock).toHaveBeenCalledTimes(1)
    expect(verifyMock.mock.calls[0][0]).toEqual('A')
    expect(verifyMock.mock.calls[0][2]).toEqual({
      algorithms: ['RS256'],
      audience,
      issuer,
    })
  })
  it('should get signing key from jwks', async () => {
    await controller.validateRequest(mockReq({ authorization: 'Bearer A' }))
    const getSigningKey = verifyMock.mock.calls[0][1]
    expect(typeof getSigningKey).toEqual('function')
    const getSigningKeyPromise = promisify(getSigningKey)
    jwksGetSigningKeyMock.mockImplementationOnce((_kid, cb) => {
      cb(null, { getPublicKey: () => 'key123' })
    })
    const res = await getSigningKeyPromise({ kid: 'kid123' })
    expect(jwksGetSigningKeyMock).toHaveBeenCalledTimes(1)
    expect(jwksGetSigningKeyMock.mock.calls[0][0]).toEqual('kid123')
    expect(res).toEqual('key123')
  })
  it('should propagate get signing key error', async () => {
    await controller.validateRequest(mockReq({ authorization: 'Bearer A' }))
    const getSigningKey = verifyMock.mock.calls[0][1]
    const getSigningKeyPromise = promisify(getSigningKey)
    const error = new Error()
    jwksGetSigningKeyMock.mockImplementationOnce((_kid, cb) => {
      cb(error)
    })
    await expect(getSigningKeyPromise({ kid: 'kid123' })).rejects.toBe(error)
  })
  it('should initialize jwks rsa with the correct options', () => {
    require('./controller')
    expect(jwksClientConstructorMock).toHaveBeenCalledTimes(1)
    expect(jwksClientConstructorMock.mock.calls[0][0]).toEqual({
      rateLimit: true,
      jwksRequestsPerMinute: 10,
      jwksUri,
    })
  })
})
