import { HandleBarTemplate } from './service'
import type { Order, OrderConfirmationEmailParameters } from './types'

const fs = require('fs')
describe('Create templates from parameters', () => {
  it('Should compile orderConfirmation.hbs template to html and assert that it matches snapshot', async () => {
    const order = {
      orderId: 'dummy-order-KYV-136',
      createdAt: '2021-08-16T07:56:57.599811',
      items: [
        {
          productId: 'productId2',
          productName: 'Kiinteähintainen tuote',
          quantity: 1,
          unit: '1',
          rowPriceNet: '600',
          rowPriceVat: '144',
          rowPriceTotal: '744',
          vatPercentage: '24',
          priceNet: '300',
          priceVat: '72',
          priceGross: '372',
          orderId: 'orderId',
          orderItemId: 'orderItemId',
        },
        {
          productId: 'productId1',
          productName: 'Kiinteähintainen tuote',
          quantity: 1,
          unit: '1',
          rowPriceNet: '600',
          rowPriceVat: '144',
          rowPriceTotal: '744',
          vatPercentage: '24',
          priceNet: '300',
          priceVat: '72',
          priceGross: '372',
          orderId: 'orderId',
          orderItemId: 'orderItemId',
        },
      ],
      merchant: {
        merchantName: 'merchantName',
        merchantStreet: 'merchantStreet',
        merchantZip: 'merchantZip',
        merchantCity: 'merchantCity',
        merchantEmail: 'merchantEmail',
        merchantPhone: 'merchantPhone',
        merchantUrl: 'merchantUrl',
        merchantBusinessId: 'merchantBusinessId',
      },
      customer: {
        firstName: 'Essi',
        lastName: 'esimerkki',
        email: 'essi.esimerkki@gmail.com',
        phone: '+358123456789',
        address: 'Esimerkkiosoite 1',
        district: '123456 Esimerkkitoimipaikka',
      },
      status: 'draft',
      type: 'order',
      payment: {
        paymentId: 'f7a4fde4-1d3c-3f60-8bbe-7ed5977bb92b',
        timestamp: '20210901-051844',
        namespace: 'asukaspysakointi',
        orderId: 'e8bcb47c-ed17-3f4b-ad1d-079001d9d2a3',
        status: 'payment_created',
        paymentMethod: 'nordea',
        paymentMethodLabel: 'Nordea',
        paymentType: 'order',
        totalExclTax: 1440,
        total: 1488,
        taxAmount: 48,
        description: null,
        additionalInfo: '{"payment_method": nordea}',
        token:
          '427a38b2607b105de58c7dbda2d8ce2f6fcb31d6cc52f77b8818c0b5dcd503f5',
        paymentUrl:
          'https://www.vismapay.com/pbwapi/token/427a38b2607b105de58c7dbda2d8ce2f6fcb31d6cc52f77b8818c0b5dcd503f5',
      },
    } as Order

    const templateParams: OrderConfirmationEmailParameters = {
      order: order,
    }

    const template = HandleBarTemplate<OrderConfirmationEmailParameters>('fi')
    template.setFileName('orderConfirmation')
    const compiledTemplate = template.createTemplate()

    const orderConfirmationTemplate = compiledTemplate(templateParams)
    // Used to make developing faster when html can be "hot reloaded" from file.
    const writeToFile = true
    if (writeToFile) {
      try {
        fs.writeFileSync(
          'packages/message-backend/src/email/create/__snapshots__/orderConfirmation.html',
          orderConfirmationTemplate
        )
        //file written successfully
      } catch (err) {
        console.error(err)
      }
    }

    expect(orderConfirmationTemplate).toMatchSnapshot()
  })
})
