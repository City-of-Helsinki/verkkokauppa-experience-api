import { ExperienceFailure } from '@verkkokauppa/core'

export class GeneralSendEmailFailure extends ExperienceFailure {
  constructor(source: Error) {
    super({
      code: 'failed-to-send-email',
      message: 'Failed to send email',
      source,
    })
  }
}

export class SendOrderConfirmationEmailFailure extends ExperienceFailure {
  constructor(source: Error) {
    super({
      code: 'failed-to-send-order-confirmation-email',
      message: 'Failed to send order confirmation email',
      source,
    })
  }
}

export class SendSubscriptionPaymentFailedEmailToCustomer extends ExperienceFailure {
  constructor(source: Error) {
    super({
      code: 'failed-to-send-subscription-payment-failed-email',
      message: 'Failed to send subscription payment failed email',
      source,
    })
  }
}

export class SendSubscriptionContractEmailFailure extends ExperienceFailure {
  constructor(source: Error) {
    super({
      code: 'failed-to-send-subscription-contract-email',
      message: 'Failed to send subscription contract email',
      source,
    })
  }
}
