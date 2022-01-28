import type { Request, Response } from 'express'
import { logger } from '../logger'
import type { AnyObjectSchema, Asserts, ObjectSchema } from 'yup'
import { RequestValidationError, UnexpectedError } from '../errors'
import { ExperienceError } from '../models'
import axios, { AxiosRequestConfig } from 'axios'

export type UnknownRequest = Request<unknown, unknown, unknown>
export type ValidatedRequest<
  TRequestSchema extends AnyObjectSchema
> = UnknownRequest & Asserts<TRequestSchema>

export abstract class AbstractController<
  TRequestSchema extends AnyObjectSchema = ObjectSchema<{}>
> {
  protected abstract readonly requestSchema: TRequestSchema | null

  protected async validateRequest(
    req: UnknownRequest
  ): Promise<ValidatedRequest<TRequestSchema>> {
    if (this.requestSchema === null) {
      return req
    }
    try {
      return await this.requestSchema.validate(req, { abortEarly: false })
    } catch (e) {
      throw new RequestValidationError(e.errors.join('\n'))
    }
  }

  protected abstract implementation(
    req: ValidatedRequest<TRequestSchema>,
    res: Response
  ): Promise<void | any>

  public async execute(req: UnknownRequest, res: Response): Promise<void> {
    const start = process.hrtime.bigint()
    try {
      const validatedReq = await this.validateRequest(req)
      await this.implementation(validatedReq, res)
    } catch (err) {
      if (err instanceof ExperienceError) {
        this.error(res, err)
      } else {
        this.error(res, new UnexpectedError(err))
      }
    }
    const end = process.hrtime.bigint()
    logger.info(
      `${req.ip} - ${req.get('user')} '${req.method} ${req.originalUrl} HTTP/:${
        req.httpVersion
      }' ${res.statusCode} ${res.get('content-length')} - ${(
        Number(end - start) * 1e-6
      ).toFixed(2)} ms`
    )
  }

  public success<T>(res: Response, dto?: T) {
    if (dto) {
      return res.status(200).json(dto)
    } else {
      return res.status(200)
    }
  }

  public created<T>(res: Response, dto?: T) {
    if (dto) {
      return res.status(201).json(dto)
    } else {
      return res.status(201)
    }
  }

  public error(res: Response, error: ExperienceError, ...e: ExperienceError[]) {
    const errors = [error, ...e]
    errors.forEach((e) => e.log(logger))
    // TODO: formulate statusCode over all errors
    const statusCode = error.definition.responseStatus
    return res
      .status(statusCode)
      .json({ errors: errors.map((e) => e.toResponseOutput()) })
  }
}

axios.interceptors.request.use((config: any) => {
  // store original data because in the response it has been stringified
  config._data = config.data
  config._start = process.hrtime.bigint()
  return config
})

const logResponse = (res: any) => {
  const config: AxiosRequestConfig & { _data: any; _start: bigint } = res.config
  if (!config) {
    return
  }
  const { _data, _start, params, method, url } = config
  const end = process.hrtime.bigint()
  logger.info({
    origin: 'local',
    method: method?.toUpperCase(),
    url: url,
    requestParams: params,
    requestBody: _data,
    responseStatus: res.status ?? res.response?.status,
    responseBody: res.data ?? res.response?.data,
    duration: _start && `${(Number(end - _start) * 1e-6).toFixed(2)} ms`,
  })
}

axios.interceptors.response.use(
  (res) => {
    logResponse(res)
    return res
  },
  (err) => {
    // delete stringified request body which might contain sensitive data when logging errors
    delete err.config?.data
    delete err.response?.config?.data
    logResponse(err)
    return Promise.reject(err)
  }
)
