import { parseOrderMetas } from '../send/service'
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
          productName: 'Pysäköintivyöhyke K',
          quantity: 1,
          unit: '1',
          rowPriceNet: '600',
          rowPriceVat: '144',
          rowPriceTotal: '744',
          vatPercentage: '24',
          priceNet: '300',
          priceVat: '72',
          priceGross: '372',
          orderId: 'orderId1',
          orderItemId: 'orderItemId1',
          meta: [
            {
              orderItemMetaId: 'ec627fb7-d557-4b7b-9c1c-61434322c109',
              orderItemId: 'orderItemId1',
              orderId: '76a9121f-3bb7-33b2-8ca8-bc6a23db24c1',
              key: 'licencePlateNumber',
              value: 'XZY-123',
              label: 'Ajoneuvo',
              visibleInCheckout: 'true',
              ordinal: '1',
            },
            {
              orderItemMetaId: 'ec627fb7-d557-4b7b-9c1c-61434322c109',
              orderItemId: 'orderItemId2',
              orderId: '76a9121f-3bb7-33b2-8ca8-bc6a23db24c1',
              key: 'vehicle',
              value: 'Skoda Octavia',
              visibleInCheckout: 'true',
              ordinal: '2',
            },
          ],
        },
        {
          productId: 'productId1',
          productName: 'Kiinteähintainen tuote 1',
          quantity: 1,
          unit: '1',
          rowPriceNet: '600',
          rowPriceVat: '144',
          rowPriceTotal: '744',
          vatPercentage: '24',
          priceNet: '300',
          priceVat: '72',
          priceGross: '372',
          orderId: 'orderId2',
          orderItemId: 'orderItemId2',
          meta: [
            {
              orderItemMetaId: 'ec627fb7-d557-4b7b-9c1c-61434322c109',
              orderItemId: 'orderItemId1',
              orderId: '76a9121f-3bb7-33b2-8ca8-bc6a23db24c1',
              key: 'meta key ordinal 0 show all',
              value: 'meta value ordinal 0 show all',
              label: '',
              visibleInCheckout: 'true',
              ordinal: '0',
            },
            {
              orderItemMetaId: 'ec627fb7-d557-4b7b-9c1c-61434322c109',
              orderItemId: 'orderItemId1',
              orderId: '76a9121f-3bb7-33b2-8ca8-bc6a23db24c1',
              key: 'meta key ordinal 0',
              value: 'when label is empty shows only value row',
              visibleInCheckout: 'true',
            },
          ],
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
        merchantTermsOfServiceUrl: 'merchantTermsOfServiceUrl',
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

    parseOrderMetas(order)

    const templateParams: OrderConfirmationEmailParameters = {
      order: order,
    }

    const template = HandleBarTemplate<OrderConfirmationEmailParameters>('fi')
    template.setFileName('orderConfirmation')
    const compiledTemplate = template.createTemplate()

    const orderConfirmationTemplate = compiledTemplate(templateParams)
    // Used to make developing faster when html can be "hot reloaded" from file.
    const writeToFile = false
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
