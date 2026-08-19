import { AbstractController } from '@verkkokauppa/core'
import type { Request, Response } from 'express'

// health checks for pipelines
export class Health extends AbstractController {
  protected readonly requestSchema = null

  protected async implementation(_req: Request, res: Response) {
    return this.success(res, { health: true })
  }
}
