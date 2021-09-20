import type { Request, Response } from 'express'
import { logger } from '../logger'
import type { AnyObjectSchema, Asserts, ObjectSchema } from 'yup'
import { RequestValidationError, UnexpectedError } from '../errors'
import { ExperienceError } from '../models'

type UnknownRequest = Request<unknown, unknown, unknown>
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
    return this.requestSchema.validate(req, { abortEarly: false })
  }

  protected abstract implementation(
    req: ValidatedRequest<TRequestSchema>,
    res: Response
  ): Promise<void | any>

  public async execute(req: UnknownRequest, res: Response): Promise<void> {
    const start = process.hrtime.bigint()
    try {
      const validatedReq = await this.validateRequest(req)
      try {
        await this.implementation(validatedReq, res)
      } catch (err) {
        if (err instanceof ExperienceError) {
          this.error(res, err)
        } else {
          this.error(res, new UnexpectedError(err))
        }
      }
    } catch (err) {
      this.error(res, new RequestValidationError(err.errors.join('\n')))
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
