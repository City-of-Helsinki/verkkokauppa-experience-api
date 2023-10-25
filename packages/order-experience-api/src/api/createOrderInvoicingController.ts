import {
  AbstractController,
  ExperienceError,
  StatusCode,
  ValidatedRequest,
} from '@verkkokauppa/core'
import * as yup from 'yup'
import type { Response } from 'express'
import {
  createInvoicingEntryForOrder,
  getOrder,
} from '@verkkokauppa/order-backend'
import { getProductInvoicings } from '@verkkokauppa/product-backend'

const requestSchema = yup.object().shape({
  params: yup.object().shape({
    orderId: yup.string().required(),
  }),
  headers: yup.object().shape({
    user: yup.string().required(),
  }),
})

export class CreateOrderInvoicingController extends AbstractController<
  typeof requestSchema
> {
  protected readonly requestSchema = requestSchema

  protected async implementation(
    req: ValidatedRequest<typeof requestSchema>,
    res: Response
  ) {
    const {
      params: { orderId },
      headers: { user },
    } = req
    const order = await getOrder({ orderId, user })

    const productInvoicings = await getProductInvoicings({
      productIds: order.items.map((i) => i.productId),
    })

    await createInvoicingEntryForOrder({
      items: order.items.map((item) => {
        const productInvoicing = productInvoicings.find(
          (i) => i?.productId === item.productId
        )
        if (!productInvoicing) {
          throw new ExperienceError({
            code: 'failed-to-find-product-invoicing',
            message: `No invoicing entry found for product ${item.productId}`,
            responseStatus: StatusCode.InternalServerError,
            logLevel: 'error',
          })
        }
        return yup
          .object({
            orderId: yup.string().required(),
            orderIncrementId: yup.string().required(),
            orderItemId: yup.string().required(),
            invoicingDate: yup.string().required(),
            customerYid: yup.string().required(),
            customerOvt: yup.string().required(),
            customerName: yup.string().required(),
            customerAddress: yup.string().required(),
            customerPostcode: yup.string().required(),
            customerCity: yup.string().required(),
            material: yup.string().required(),
            orderType: yup.string().required(),
            salesOrg: yup.string().required(),
            salesOffice: yup.string().required(),
            materialDescription: yup.string().required(),
            quantity: yup.number().required(),
            unit: yup.string().required(),
            priceNet: yup.string().required(),
          })
          .validateSync({
            orderId: order.orderId,
            orderIncrementId: order.incrementId,
            orderItemId: item.orderItemId,
            invoicingDate: item.invoicingDate?.toISOString(),
            customerYid: order.invoice?.businessId,
            customerOvt: order.invoice?.ovtId,
            customerName: order.invoice?.name,
            customerAddress: order.invoice?.address,
            customerPostcode: order.invoice?.postcode,
            customerCity: order.invoice?.city,
            material: productInvoicing.material,
            orderType: productInvoicing.orderType,
            salesOrg: productInvoicing.salesOrg,
            salesOffice: productInvoicing.salesOffice,
            materialDescription: item.productName,
            quantity: item.quantity,
            unit: item.unit,
            priceNet: item.priceNet,
          })
      }),
    })

    return this.created(res)
  }
}
