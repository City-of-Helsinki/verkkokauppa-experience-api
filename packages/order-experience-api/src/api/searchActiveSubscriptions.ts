import { AbstractController, Data, ValidatedRequest } from '@verkkokauppa/core'
import type { Response } from 'express'
import { searchActiveSubscriptions } from '@verkkokauppa/order-backend'
import * as yup from 'yup'
import { validateApiKey } from '@verkkokauppa/configuration-backend'

const requestSchema = yup.object().shape({
  headers: yup.object().shape({
    'api-key': yup.string().required(),
  }),
  body: yup.object().shape({
    activeAtDate: yup.string().required(),
    customerEmail: yup.string().required(),
    status: yup.string().required(),
    namespace: yup.string().required(),
  }),
})

export class searchActiveSubscriptionsController extends AbstractController<
  typeof requestSchema
> {
  protected readonly requestSchema = requestSchema

  protected async implementation(
    req: ValidatedRequest<typeof requestSchema>,
    res: Response
  ): Promise<any> {
    const {
      body,
      headers: { 'api-key': apiKey },
    } = req

    await validateApiKey({ namespace: body.namespace, apiKey })

    const dto = new Data(await searchActiveSubscriptions(body))

    return this.created<any>(res, dto.serialize())
  }
}
