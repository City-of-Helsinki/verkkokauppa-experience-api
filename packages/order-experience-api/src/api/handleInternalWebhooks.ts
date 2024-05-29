import {
  AbstractController,
  logger,
  ValidatedRequest,
} from '@verkkokauppa/core'
import * as yup from 'yup'
import type { Response } from 'express'
import { validateWebhookApiKey } from '@verkkokauppa/configuration-backend'

const requestSchema = yup.object().shape({
  body: yup.object().shape({
    namespace: yup.string().notRequired().default(''),
    orderId: yup.string().notRequired().default(''),
    timestamp: yup.string().notRequired().default(''),
    eventType: yup.string().notRequired().default(''),
    subscriptionId: yup.string().notRequired().default(''),
    paymentId: yup.string().notRequired().default(''),
    eventTimestamp: yup.string().notRequired().default(''),
    paymentPaidTimestamp: yup.string().notRequired().default(''),
  }),
  headers: yup.object().shape({
    'webhook-api-key': yup.string().required(),
    namespace: yup.string().required(),
  }),
})

export class HandleInternalWebhooks extends AbstractController<
  typeof requestSchema
> {
  protected readonly requestSchema = requestSchema

  protected async implementation(
    req: ValidatedRequest<typeof requestSchema>,
    res: Response
  ): Promise<any> {
    const {
      body: { eventType },
      headers: { 'webhook-api-key': webhookApiKey, namespace: namespace },
    } = req
    await validateWebhookApiKey({ apiKey: webhookApiKey, namespace })

    logger.info(
      `Handling webhook type ${eventType} for namespace: ${namespace} with data: ${JSON.stringify(
        req.body
      )}`
    )

    return this.success(res, req.body)
  }
}
