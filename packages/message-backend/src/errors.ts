import { ExperienceFailure } from '@verkkokauppa/core'

export class SendOrderConfirmationEmailFailure extends ExperienceFailure {
  constructor(source: Error) {
    super({
      code: 'failed-to-send-order-confirmation-email',
      message: 'Failed to send order confirmation email',
      source,
    })
  }
}
