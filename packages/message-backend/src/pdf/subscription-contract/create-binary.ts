import pdfmake = require('pdfmake')
import * as path from 'path'
import { documentDefinition } from './document-definition'
import { createBinary } from '../create-binary'

const printer = new pdfmake({
  Roboto: {
    normal: path.join(__dirname, '../fonts/Roboto-Regular.ttf'),
    bold: path.join(__dirname, '../fonts/Roboto-Bold.ttf'),
  },
})

export const createSubscriptionContractBinary = (
  ...params: Parameters<typeof documentDefinition>
) => {
  return createBinary(printer, documentDefinition(...params))
}
