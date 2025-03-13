// eslint-disable-next-line import/no-unresolved,prettier/prettier

const fs = require('fs')
const path = require('path')

export const loadPDFFromDir = (
  dirName: string,
  pdfFileName: string
): Promise<string> => {
  const filePath = path.join(process.cwd(), dirName, pdfFileName)
  console.log('Trying to read file from: ' + filePath)

  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath)
    const chunks: any = []

    stream.on('data', (chunk: Buffer | string) => {
      chunks.push(chunk)
    })

    stream.on('end', () => {
      const pdf = Buffer.concat(chunks).toString('base64')
      resolve(pdf)
    })

    stream.on('error', (error: Error) => {
      console.error('Error reading file:', error)
      reject(error)
    })
  })
}
