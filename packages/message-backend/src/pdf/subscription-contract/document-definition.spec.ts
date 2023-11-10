import { documentDefinition } from './document-definition'
import type { Subscription } from '../../email/create/types'
import * as path from 'path'
import { createBinary } from '../create-binary'
// eslint-disable-next-line import/no-unresolved,prettier/prettier
import pdfmake = require('pdfmake')

describe('document-definition.ts', () => {
  it('should format a provided date correctly', () => {
    const subscription = {
      subscriptionId: '5d751fd9-9591-35ea-a2d1-9df3a834adcc',
      orderId: '4e6ccc41-0323-380a-948d-49d07f4cce16',
      status: 'active',
      namespace: 'asukaspysakointi',
      customerFirstName: 'dummy_firstname',
      customerLastName: 'dummy_lastname',
      customerEmail: '76ffa1a5-19b1-4eed-b969-f6a88c1f8b9e@ambientia.fi',
      paymentMethodToken:
        'tmTpd9z3l4GU4Zw01HiOnjmRyxMDIRYef7Dvo1+gJa3NUuLe3wfdEVURERzCLTvN1puZWNIMng7M27PaZQD7Jpl44gAHUdt5f4Or+KKS5KM=',
      paymentMethodExpirationYear: '2034',
      paymentMethodExpirationMonth: '12',
      paymentMethodCardLastFourDigits: '4321',
      user: 'dummy_user',
      startDate: '2023-11-02T13:16:59.770Z',
      endDate: '2023-12-02T23:59:59.999Z',
      billingStartDate: '2023-11-02T13:16:59.770Z',
      periodUnit: 'monthly',
      periodFrequency: 1,
      periodCount: 2,
      productId: 'productId',
      orderItemId: '8db81380-cf09-4b40-b6b9-92d85b38aa8c',
      productName: 'productName',
      quantity: 1,
      vatPercentage: '24',
      priceNet: '100',
      priceVat: '24',
      priceGross: '124',
      meta: [
        {
          orderItemMetaId: 'ec627fb7-d557-4b7b-9c1c-61434322c109',
          orderItemId: 'orderItemId1',
          orderId: '76a9121f-3bb7-33b2-8ca8-bc6a23db24c1',
          subscriptionId: '5d751fd9-9591-35ea-a2d1-9df3a834adcc',
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
          subscriptionId: '5d751fd9-9591-35ea-a2d1-9df3a834adcc',
          key: 'vehicle',
          value: 'Skoda Octavia',
          visibleInCheckout: 'true',
          ordinal: '2',
        },
      ],
      merchantName: 'merchantName',
      productLabel: 'productLabel',
    } as Subscription

    // @ts-ignore
    const result = documentDefinition({
      ...subscription,
    })

    expect(result).toEqual({
      content: [
        {
          bold: true,
          text: 'merchantName: productName productLabel\n',
        },
        {
          bold: false,
          text:
            '© Ajoneuvon tiedot - Liikenneasioidenrekisteri, Traficom\n\n\n',
        },
        {
          table: {
            body: [
              [
                'Tilaussopimuksen osapuolet',
                {
                  stack: [
                    'merchantName, jäljempänä ”Asiointipalvelu”',
                    '\n',
                    'dummy_firstname dummy_lastname, jäljempänä ”Tilaaja”',
                    '\n',
                  ],
                },
              ],
              [
                'Tilaussopimuksen kohde',
                '5d751fd9-9591-35ea-a2d1-9df3a834adcc\n\n',
              ],
              [
                'Tilaussopimuksen kesto',
                {
                  stack: [
                    'Tilaussopimus on voimassa 02.11.2023 alkaen toistaiseksi',
                    '\n',
                  ],
                },
              ],
              [
                'Tilaussopimukseen liittyvien maksujen veloittaminen',
                {
                  stack: [
                    'Sopimukseen liittyvät maksut veloitetaan tilausjaksoissa.',
                    '\n',
                    'Ensimmäinen tilausjakso 02.11.2023 13:16 – 02.12.2023 23:59 maksettu 10.11.2023.',
                    '\n',
                    'Seuraavan tilausjakson veloitus 10.11.2023, jonka jälkeen 1 kuukauden välein.',
                    '\n',
                    'Maksut veloitetaan Tilaajan ensimmäisen maksun yhteydessä antamalta maksuvälineeltä tai Tilaajan päivittäessä maksuvälineen tietoa viimeksi päivitetyltä maksuvälineeltä.',
                    '\n',
                  ],
                },
              ],
              ['Tilausjakson pituus', '1 kk\n\n'],
              [
                'Tilausjakson hinta sopimuksen syntyhetkellä',
                '124 € / 1 kk\n\n',
              ],
              [
                'Tilaussopimusta koskevat ehdot',
                {
                  stack: [
                    'Tätä sopimusta koskevat ehdot:',
                    '\n',
                    {
                      margin: [10, 0, 0, 0],
                      ul: [
                        'Jatkuvia tilauksia koskevat yleiset ehdot',
                        'Asiointipalvelun sopimusehdot',
                      ],
                    },
                    '\n',
                  ],
                },
              ],
              [
                'Tilaussopimusta koskevat reklamaatiot',
                {
                  stack: [
                    'Tilaussopimusta koskevat reklamaatiot tulee osoittaa Asiointipalvelulle.',
                    '\n',
                  ],
                },
              ],
            ],
            headerRows: 0,
            widths: ['50%', '50%'],
          },
        },
      ],
      defaultStyle: {
        fontSize: 11,
      },
      header: expect.any(Function),
      pageMargins: [50, 125, 50, 10],
    })

    const printer = new pdfmake({
      Roboto: {
        normal: path.join(__dirname, '../fonts/Roboto-Regular.ttf'),
        bold: path.join(__dirname, '../fonts/Roboto-Bold.ttf'),
      },
    })

    // eslint-disable-next-line jest/valid-expect-in-promise
    Promise.resolve(createBinary(printer, result)).then((binary) => {
      const writeToFile = true
      if (writeToFile) {
        // write to file test-output/subscription-contract.pdf
        const fs = require('fs')
        const path = require('path')
        const filePath = path.join(
          __dirname,
          'test-output/subscription-contract.pdf'
        )
        fs.writeFile(filePath, binary, 'base64', (err: any) => {
          if (err) {
            console.error('An error occured while writing PDF to File.', err)
          } else {
            console.log('PDF written to File.')
          }
        })
      }
    })
  })
})
