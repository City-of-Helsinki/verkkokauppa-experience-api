import type { Request, Response } from 'express'
import { logger } from '../logger'

export abstract class AbstractController {
  protected abstract implementation(
    req: Request<any>,
    res: Response
  ): Promise<void | any>

  public async execute(req: Request, res: Response): Promise<void> {
    try {
      await this.implementation(req, res)
    } catch (err) {
      logger.error(`[AbstractController]: Uncaught controller error`)
      logger.error(err)
      this.fail(res, 'An unexpected error occurred')
    }
  }

  public static json(res: Response, code: number, message: string) {
    return res.status(code).json({ message })
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

  public clientError(res: Response, message?: string) {
    return AbstractController.json(res, 400, message ? message : 'Unauthorized')
  }

  public unauthorized(res: Response, message?: string) {
    return AbstractController.json(res, 401, message ? message : 'Unauthorized')
  }

  public forbidden(res: Response, message?: string) {
    return AbstractController.json(res, 403, message ? message : 'Forbidden')
  }

  public notFound(res: Response, message?: string) {
    return AbstractController.json(res, 404, message ? message : 'Not found')
  }

  public fail(res: Response, error: Error | string) {
    console.log(error)
    return res.status(500).json({
      message: error.toString(),
    })
  }
}
