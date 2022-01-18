import * as yup from 'yup'
import { AbstractController, Data, ValidatedRequest } from '@verkkokauppa/core'
import type { Response } from 'express'
import { validateApiKey } from '@verkkokauppa/configuration-backend'
import { setSubscriptionItemMeta } from '@verkkokauppa/order-backend'

const requestSchema = yup.object().shape({
  params: yup.object().shape({
    id: yup.string().required(),
    itemId: yup.string().required(),
  }),
  body: yup.object().shape({
    meta: yup
      .array()
      .of(
        yup
          .object()
          .shape({
            key: yup.string().required(),
            value: yup.string().required(),
            label: yup.string().notRequired(),
            visibleInCheckout: yup.boolean().notRequired(),
            ordinal: yup.string().notRequired(),
          })
          .noUnknown()
      )
      .required(),
  }),
  headers: yup.object().shape({
    'api-key': yup.string().required(),
    namespace: yup.string().required(),
  }),
})

export class SetSubscriptionItemMetaController extends AbstractController<
  typeof requestSchema
> {
  protected readonly requestSchema = requestSchema

  protected async implementation(
    req: ValidatedRequest<typeof requestSchema>,
    res: Response
  ): Promise<any> {
    const {
      params: { id: subscriptionId, itemId: orderItemId },
      body: { meta },
      headers: { 'api-key': apiKey, namespace },
    } = req
    await validateApiKey({ apiKey, namespace })

    const dto = new Data({
      meta: await setSubscriptionItemMeta({
        subscriptionId,
        orderItemId,
        meta,
      }),
    })

    return this.success(res, dto.serialize())
  }
}
