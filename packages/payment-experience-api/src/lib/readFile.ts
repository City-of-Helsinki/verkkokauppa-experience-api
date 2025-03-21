import {
  createInvoiceTermsOfServiceBinary,
  sendOrderConfirmationEmailToCustomer,
} from '@verkkokauppa/message-backend'
import {
  getPaymentForOrder,
  Order,
  PaymentStatus,
} from '@verkkokauppa/payment-backend'
import { ExperienceFailure, logger } from '@verkkokauppa/core'
import {
  downloadMerchantTermsOfServiceBinary,
  getMerchantDetailsForOrder,
} from '@verkkokauppa/configuration-backend'
import { isCardRenewal } from './paymentReturnService'

const fs = require('fs').promises
const path = require('path')

export const readFile = async (filename: string) => {
  let data
  try {
    const filePath = path.join(__dirname, 'public', filename)
    data = await fs.readFile(filePath, 'utf8')
    console.log(data)
  } catch (error) {
    console.error('Error reading file' + filename + '. ', error)
  }
  return data
}
