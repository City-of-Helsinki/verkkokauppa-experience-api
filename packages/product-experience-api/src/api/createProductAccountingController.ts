import {
  AbstractController,
  Data,
  logger,
  ValidatedRequest,
} from '@verkkokauppa/core'
import type { Response } from 'express'
import {
  createProductAccounting,
  createProductInvoicing,
} from '@verkkokauppa/product-backend'
import * as yup from 'yup'
import { validateApiKey } from '@verkkokauppa/configuration-backend'

const nextEntitySchema = yup
  .object({
    companyCode: yup.string().nullable().notRequired(),
    mainLedgerAccount: yup.string().nullable().notRequired(),
    vatCode: yup.string().nullable().notRequired(),
    internalOrder: yup.string().nullable().notRequired(),
    profitCenter: yup.string().nullable().notRequired(),
    balanceProfitCenter: yup.string().nullable().notRequired(),
    project: yup.string().nullable().notRequired(),
    operationArea: yup.string().nullable().notRequired(),
  })
  .test(
    'Only one accounting identifier',
    'Accounting information should only have internalOrder or profitCenter defined. If neither is given then project has to be defined.',
    (value) => {
      if (!value) return false

      // only internalOrder or profitCenter should be used
      // if neither of them is used then project should be defined
      const hasInternalOrder = !!value.internalOrder
      const hasProfitCenter = !!value.profitCenter
      const hasProject = !!value.project

      // InternalOrder and ProfitCenter should not be provided at the same time
      if (hasInternalOrder && hasProfitCenter) {
        return false
      }

      // if neither provided then project is required
      if (!hasInternalOrder && !hasProfitCenter) {
        return hasProject
      }

      return true
    }
  )
  .nullable()
  .notRequired()

const requestSchema = yup.object().shape({
  params: yup.object().shape({
    productId: yup.string().required(),
  }),
  body: yup
    .object({
      vatCode: yup.string().required(),
      companyCode: yup.string().required(),
      mainLedgerAccount: yup.string().required(),
      internalOrder: yup.string().notRequired(),
      profitCenter: yup.string().notRequired(),
      balanceProfitCenter: yup.string().required(),
      project: yup.string().notRequired(),
      operationArea: yup.string().notRequired(),
      productInvoicing: yup
        .object({
          salesOrg: yup.string().required().length(4),
          salesOffice: yup.string().required().length(4),
          material: yup.string().required().length(8),
          orderType: yup.string().required().length(4),
        })
        .notRequired()
        .default(undefined),
      activeFrom: yup.date().nullable().notRequired(),
      nextEntity: nextEntitySchema.when('activeFrom', {
        is: (value: null | undefined) => value !== null && value !== undefined,
        then: yup
          .object()
          .required('nextEntity is required when activeFrom is provided'),
        otherwise: nextEntitySchema,
      }),
    })
    .test(
      'Only one accounting identifier',
      'Accounting information should only have internalOrder or profitCenter defined. If neither is given then project has to be defined.',
      (value) => {
        if (!value) return false

        // only internalOrder or profitCenter should be used
        // if neither of them is used then project should be defined
        const hasInternalOrder = !!value.internalOrder
        const hasProfitCenter = !!value.profitCenter
        const hasProject = !!value.project

        // InternalOrder and ProfitCenter should not be provided at the same time
        if (hasInternalOrder && hasProfitCenter) {
          return false
        }

        // if neither provided then project is required
        if (!hasInternalOrder && !hasProfitCenter) {
          return hasProject
        }

        return true
      }
    ),
  headers: yup.object().shape({
    'api-key': yup.string().required(),
    namespace: yup.string().required(),
  }),
})

export class CreateProductAccountingController extends AbstractController<
  typeof requestSchema
> {
  protected readonly requestSchema = requestSchema

  protected async implementation(
    req: ValidatedRequest<typeof requestSchema>,
    res: Response
  ): Promise<any> {
    const { productId } = req.params
    const { 'api-key': apiKey, namespace } = req.headers
    const { productInvoicing, ...accounting } = req.body
    const productAccounting: any = { productId, ...accounting, namespace }

    await validateApiKey({ namespace, apiKey })

    logger.debug(
      `Create product accounting for product id: ${productAccounting.productId}`
    )

    const [accountingRes, invoicingRes] = await Promise.all([
      createProductAccounting({ productAccounting }),
      productInvoicing != null
        ? createProductInvoicing({
            productInvoicing: { productId, ...productInvoicing },
          })
        : undefined,
    ])

    const dto = new Data({ ...accountingRes, productInvoicing: invoicingRes })

    return this.created<any>(res, dto.serialize())
  }
}
