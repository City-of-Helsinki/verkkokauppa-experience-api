// eslint-disable-next-line import/no-unresolved,prettier/prettier
import type { TDocumentDefinitions } from 'pdfmake/interfaces'
import type PdfPrinter = require('pdfmake')

export const createBinary = (
  printer: PdfPrinter,
  documentDefinition: TDocumentDefinitions
): Promise<string> => {
  return new Promise((resolve) => {
    const doc = printer.createPdfKitDocument(documentDefinition)
    const chunks: any = []

    doc.on('data', (chunk) => {
      chunks.push(chunk)
    })
    doc.on('end', () => {
      const pdf = Buffer.concat(chunks).toString('base64')
      resolve(pdf)
    })
    doc.end()
  })
}
