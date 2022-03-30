import {
  AbstractController,
  ExperienceError,
  StatusCode,
  UnknownRequest,
  ValidatedRequest,
} from '@verkkokauppa/core'
import type { Response } from 'express'
import { withAuthentication } from '@verkkokauppa/auth-helsinki-profile'
import * as yup from 'yup'

const requestSchema = yup.object().shape({
  params: yup.object().shape({
    user: yup.string().required(),
  }),
  headers: yup.object().shape({
    user: yup.string().required(),
  }),
  query: yup.object().shape({
    dry_run: yup.boolean().default(false),
  }),
})

export class DeleteGdprController extends withAuthentication(
  AbstractController,
  true
)<typeof requestSchema> {
  protected readonly requestSchema = requestSchema

  protected async validateRequest(req: UnknownRequest) {
    try {
      return await super.validateRequest(req)
    } catch (e) {
      if (
        e instanceof ExperienceError &&
        e.definition.responseStatus === StatusCode.Forbidden
      ) {
        e.definition.responseStatus = StatusCode.Unauthorized
      }
      throw e
    }
  }

  protected async implementation(
    req: ValidatedRequest<typeof requestSchema>,
    res: Response
  ): Promise<any> {
    const {
      params: { user: userParam },
      headers: { user },
    } = req

    if (userParam !== user) {
      throw new ExperienceError({
        code: 'authentication-failed',
        message: 'Authenticated user does not match given id',
        responseStatus: StatusCode.Unauthorized,
        logLevel: 'info',
      })
    }

    return res.status(StatusCode.Forbidden).json({
      errors: [
        {
          code: 'profile-deletion-failed',
          message: {
            en: 'Forbidden due accounting act',
          },
        },
      ],
    })
  }
}
