// eslint-disable-next-line import/no-unresolved
import type { TDocumentDefinitions } from 'pdfmake/interfaces'
import type i18default from 'i18next'
const i18n: typeof i18default = require('i18next')
import * as translations from './translations.json'

i18n
  .init({
    interpolation: {
      escapeValue: false,
    },
    lng: 'fi',
    resources: translations,
  })
  .then(() => {})

const sideMargin = 50

const datetimeFormat = ['fi-FI', { timeZone: 'Europe/Helsinki' }] as const
const localeDateString = (datetime?: string) => {
  const d = datetime ? new Date(datetime) : new Date()
  // For some reason fi-FI yields mm/dd/yyyy instead of dd.mm.yyyy
  const parts = d.toLocaleDateString(...datetimeFormat).split('/')
  return `${parts[1]}.${parts[0]}.${parts[2]}`
}

export const documentDefinition = (subscription: {
  subscriptionId: string
  merchantName: string
  productName: string
  customerFirstName: string
  customerLastName: string
  startDate: string
  endDate: string
  periodUnit: string
  periodFrequency: string | number
  firstPaymentDate: string
  secondPaymentDate: string
  priceGross: string
}): TDocumentDefinitions => {
  return {
    defaultStyle: {
      fontSize: 11,
    },
    pageMargins: [sideMargin, 125, sideMargin, 10] as any,
    header: (currentPage: number, pageCount: number) =>
      ({
        margin: [sideMargin, 40, sideMargin, 0] as any,
        columns: [
          {
            width: '50%',
            stack: [
              {
                image:
                  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABFYAAAIDCAYAAAAuU5oYAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAABBBpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMTM4IDc5LjE1OTgyNCwgMjAxNi8wOS8xNC0wMTowOTowMSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOjliNTM5MDc4LTRlOTktNDVhMS05MGMwLTMzMGNhNTExNTFlOCIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDpERjVBQzlEQTE4NUQxMUU3QjRBNEEyOTMwOUI3OEEzRCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpERjVBQzlEOTE4NUQxMUU3QjRBNEEyOTMwOUI3OEEzRCIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBJbGx1c3RyYXRvciBDQyAyMDE3IChNYWNpbnRvc2gpIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InV1aWQ6NTc0OWQyODQtYWJiMC0xODRiLWEzMzMtMjI4YThkNjIzYzMyIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOmIxNzI3ZDlkLWIxMmItNGE3MS1iZTE0LTBhNTA1NjAyZjEwZCIvPiA8ZGM6dGl0bGU+IDxyZGY6QWx0PiA8cmRmOmxpIHhtbDpsYW5nPSJ4LWRlZmF1bHQiPkhFTFNJTktJX1R1bm51c19NVVNUQV9DTVlLPC9yZGY6bGk+IDwvcmRmOkFsdD4gPC9kYzp0aXRsZT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7of6GXAABPK0lEQVR42uzdB7gdRdkA4A2hBwx1EQRFwUpVEFBREBQbTZooiigWbNiwYEEsqNjFhoIi6G9DUBERC4iCIL2jNAkgCEuRklCEwP8NZ9EQQ3Kz99yzs+e87/N8z1xCcnd2Zs7e2e/uzkwqy/L+AgAAAID5toAmAAAAAGhGYgUAAACgIYkVAAAAgIYkVgAAAAAaklgBAAAAaEhiBQAAAKAhiRUAAACAhiRWAAAAABqSWAEAAABoSGIFAAAAoCGJFQAAAICGJFYAAAAAGpJYAQAAAGhIYgUAAACgIYkVAAAAgIYkVgAAAAAaklgBAAAAaEhiBQAAAKAhiRUAAACAhiRWAAAAABqSWAEAAABoSGIFAAAAoCGJFQAAAICGJFYAAAAAGpJYAQAAAGhIYgUAAACgIYkVAAAAgIYkVgAAAAAaklgBAAAAaEhiBQAAAKAhiRUAAACAhhbMoA5L6wYAAACgoX+1efDWEytVVd1iDAAAAABNlGXZ6vG9CgQAAADQkMQKAAAAQEMSKwAAAAANSawAAAAANCSxAgAAANCQxAoAAABAQxIrAAAAAA1JrAAAAAA0JLECAAAA0JDECgAAAEBDEisAAAAADUmsAAAAADQksQIAAADQkMQKAAAAQEMSKwAAAAANSawAAAAANCSxAgAAANCQxAoAAABAQxIrAAAAAA1JrAAAAAA0JLECAAAA0JDECgAAAEBDEisAAAAADUmsAAAAADQksQIAAADQkMQKAAAAQEMSKwAAAAANSawAAAAANCSxAgAAANCQxAoAAABAQxIrAAAAAA1JrAAAAAA0JLECAAAA0JDECgAAAEBDEisAAAAADUmsAAAAADQksQIAAADQkMQKAAAAQEMSKwAAAAANSawAAAAANCSxAgAAANCQxAoAAABAQxIrAAAAAA1JrAAAAAA0JLECAAAA0JDECgAAAEBDEisAAAAADUmsAAAAADQksQIAAADQkMQKAAAAQEMSKwAAAAANSawAAAAANCSxAgAAANCQxAoAAABAQxIrAAAAAA1JrAAAAAA0JLECAAAA0JDECgAAAEBDEisAAAAADUmsAAAAADQksQIAAADQkMQKAAAAQEMSKwAAAAANSawAAAAANCSxAgAAANCQxAoAAABAQxIrAAAAAA1JrAAAAAA0JLECAAAA0JDECgAAAEBDEisAAAAADUmsAAAAADQksQIAAADQkMQKAAAAQEMSKwAAAAANSawAAAAANCSxAgAAANCQxAoAAABAQxIrAAAAAA1JrAAAAAA0JLECAAAA0JDECgAAAEBDEisAAAAADUmsAAAAADQksQIAAADQkMQKAAAAQEMSKwAAAAANSawAAAAANCSxAgAAANCQxAoAAABAQxIrAAAAAA1JrAAAAAA0JLECAAAA0JDECgAAAEBDEisAAAAADUmsAAAAADQksQIAAADQkMQKAAAAQEMSKwAAAAANSawAAAAANCSxAgAAANCQxAoAAABAQxIrAAAAAA1JrAAAAAA0JLECAAAA0JDECgAAAEBDEisAAAAADUmsAAAAADQksQIAAADQkMQKAAAAQEMSKwAAAAANSawAAAAANCSxAgAAANCQxAoAAABAQxIrAAAAAA0tqAkAALqjLMupUawWMbWOGRHTI/5eVdX1WogOjeWjo1iihUNfFp+V1+mBLMfEI6N4bD0upkTcGnFLfX27VQuRK4kVALow0Vouis+1dPirYjK3j16gxfGfbjC2jNg6YuOIVebyd2+O4uSIX0UcGWO30oJkLI3nqS0cdylNn831baUoto94YcQzIpaey9+9MoqTIlJC7ui4vE3XguRiUgzQ+9usQHwgJukGAOYx8Vo1iitaOvy58bNqXb1ASzcc743YvWj2W/2ZEYdHfDrG8LlalAzHeHoSoY3Eiut6+32/XhTvj3hpxOQG3+K2iIMiPhd9eZ0Wpe28hjVWAADymhxOjtg7vrw04u1F81cl0s3KzhFnx/c7qH6FCKDN69syEYfEl6dH7FA0S6okj4h4d7pOxvfbK103tS5tklgBAMjnpiM9pXJixCcjFu/Tt01PB6f1JM6L7/90rQy0dH17ZhTnR+xWX5f6ISWePxvxh/j+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',
                width: 95,
              },
            ],
          },
          {
            width: '*',
            stack: [
              { text: 'TILAUSSOPIMUS', bold: true },
              '\n\n',
              localeDateString(),
            ],
          },
          {
            text: `${currentPage}(${pageCount})`,
            width: '*',
            alignment: 'right',
          },
        ],
      } as any),
    content: [
      {
        text: `${subscription.merchantName}: ${subscription.productName}\n\n\n`,
        bold: true,
      },
      {
        table: {
          headerRows: 0,
          widths: ['50%', '50%'],
          body: [
            [
              'Tilaussopimuksen osapuolet',
              {
                stack: [
                  `${subscription.merchantName}, jäljempänä ”Asiointipalvelu”`,
                  '\n',
                  `${subscription.customerFirstName} ${subscription.customerLastName}, jäljempänä ”Tilaaja”`,
                  '\n',
                ],
              },
            ],
            ['Tilaussopimuksen kohde', `${subscription.subscriptionId}\n\n`],
            [
              'Tilaussopimuksen kesto',
              {
                stack: [
                  `Tilaussopimus on voimassa ${localeDateString(
                    subscription.startDate
                  )} alkaen toistaiseksi`,
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
                  `Ensimmäinen tilausjakso ${localeDateString(
                    subscription.startDate
                  )} – ${localeDateString(
                    subscription.endDate
                  )} maksettu ${localeDateString(
                    subscription.firstPaymentDate
                  )}.`,
                  '\n',
                  `Seuraavan tilausjakson veloitus ${localeDateString(
                    subscription.secondPaymentDate
                  )}, jonka jälkeen ${subscription.periodFrequency} ${i18n.t(
                    `c4_2_3_${subscription.periodUnit}`
                  )} välein.`,
                  '\n',
                  'Maksut veloitetaan Tilaajan ensimmäisen maksun yhteydessä antamalta maksuvälineeltä tai Tilaajan päivittäessä maksuvälineen tietoa viimeksi päivitetyltä maksuvälineeltä.',
                  '\n',
                ],
              },
            ],
            [
              'Tilausjakson pituus',
              `${subscription.periodFrequency} ${i18n.t(
                `abbr_${subscription.periodUnit}`
              )}\n\n`,
            ],
            [
              'Tilausjakson hinta',
              `${subscription.priceGross} € / ${
                subscription.periodFrequency
              } ${i18n.t(`abbr_${subscription.periodUnit}`)}\n\n`,
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
        },
      },
    ],
  }
}
