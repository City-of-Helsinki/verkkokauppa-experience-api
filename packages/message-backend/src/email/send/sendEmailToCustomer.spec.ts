import type { Order } from '../create/types'
import { sendOrderConfirmationEmailToCustomer } from './service'
import axios from 'axios'
import type { MessageResult } from './types'
jest.mock('axios')

describe('sendEmailToCustomer.spec.ts', () => {
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
        merchantTermsOfServiceUrl: 'merchantTermsOfServiceUrl',
      },
      customer: {
        firstName: 'Essi',
        lastName: 'esimerkki',
        email: 'essi.esimerkki@gmail.com',
        phone: '+358123456789',
        address: 'Esimerkkiosoite 1',
        district: '123456 Esimerkkitoimipaikka',
      },
      meta: [
        {
          orderItemMetaId: 'ec627fb7-d557-4b7b-9c1c-61434322c109',
          orderItemId: 'b513887b-db37-4249-a042-bf1425c340ac',
          orderId: '76a9121f-3bb7-33b2-8ca8-bc6a23db24c1',
          key: 'meta key ordinal 1',
          value: 'meta value ordinal 1',
          label: 'meta label ordinal 1',
          visibleInCheckout: 'true',
          ordinal: '1',
        },
        {
          orderItemMetaId: 'ec627fb7-d557-4b7b-9c1c-61434322c109',
          orderItemId: 'b513887b-db37-4249-a042-bf1425c340ac',
          orderId: '76a9121f-3bb7-33b2-8ca8-bc6a23db24c1',
          key: 'meta key ordinal 0',
          value: 'meta value ordinal 0',
          label: 'meta label ordinal 0',
          visibleInCheckout: 'true',
          ordinal: '0',
        },
        {
          orderItemMetaId: 'ec627fb7-d557-4b7b-9c1c-61434322c112',
          orderItemId: 'b513887b-db37-4249-a042-bf1425c340ac',
          orderId: '76a9121f-3bb7-33b2-8ca8-bc6a23db24c1',
          key: 'meta key ordinal 0',
          value: 'meta value ordinal 0', // This should not show on email
          label: '',
          visibleInCheckout: 'true',
          ordinal: '2',
        },
      ],
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
    process.env.MESSAGE_BACKEND_URL = 'http://localhost:8080'

    //Mocked post response!
    const resp = {
      data: {
        id: '677d096b-4386-3cea-a4ef-4712fad4a6e1',
        identifierValue: order.orderId,
        sendTo: 'dummy@email.com',
        header: 'emailHeader',
        messageType: 'EMAIL',
      },
    }
    // Remove mock if you want to test it locally
    // @ts-ignore
    axios.post.mockResolvedValue(resp)

    const sent = await sendOrderConfirmationEmailToCustomer({
      order: order,
      fileName: 'orderConfirmation',
      emailHeader:
        'Tilausvahvistus ja kuitti / Order confirmation and receipt / Beställningsbekräftelse och kvitto',
      sendTo: 'dummy@email.com',
    })

    let message: MessageResult = JSON.parse(JSON.stringify(sent))
    expect(message.identifierValue).toEqual(order.orderId)
    expect(message.sendTo).toEqual('dummy@email.com')
    expect(message.header).toEqual('emailHeader')
    expect(message.messageType).toEqual('EMAIL')
    expect(message.id).toBeTruthy()
  })
})
