import {
  AbstractController,
  Data,
  logger,
  ValidatedRequest,
} from '@verkkokauppa/core'
import type { Response } from 'express'
import { addFlowStepsToOrder } from '@verkkokauppa/order-backend'
import * as yup from 'yup'

const requestSchema = yup.object().shape({
  body: yup.object().shape({
    activeStep: yup.number().required().moreThan(0),
    totalSteps: yup.number().required().moreThan(0),
  }),
  params: yup.object().shape({
    orderId: yup.string().required(),
  }),
  headers: yup.object().shape({
    user: yup.string().required(),
  }),
})

export class CreateFlowStepController extends AbstractController<
  typeof requestSchema
> {
  protected readonly requestSchema = requestSchema
  protected async implementation(
    req: ValidatedRequest<typeof requestSchema>,
    res: Response
  ): Promise<any> {
    const {
      params: { orderId },
      body: { activeStep, totalSteps },
    } = req

    logger.debug(`Add flow steps to order ${orderId}`)

    const dto = new Data(
      await addFlowStepsToOrder({
        orderId,
        activeStep,
        totalSteps,
      })
    )

    return this.success<any>(res, dto.serialize())
  }
}
