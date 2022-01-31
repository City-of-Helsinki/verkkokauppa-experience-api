import type { EmailTemplateDto, HbsTemplateFiles } from './types'

import * as Handlebars from 'handlebars'
import i18next from './../../i18n/init'
import type { SUPPORTED_LANGUAGES } from '../../i18n/types'
import { debug } from 'console'

const fs = require('fs')
const path = require('path')

export const createOrderConfirmationEmailTemplate = async <T>(params: {
  fileName: HbsTemplateFiles
  templateParams: T
}): Promise<EmailTemplateDto> => {
  const handleBar = HandleBarTemplate<T>('fi')
  const files = fs.readdirSync(path.join(__dirname, `/templates/`))

  if (!files.includes(`${params.fileName}.hbs`)) {
    return {
      template: '',
      error: 'Email template cant be found',
    }
  }
  handleBar.setFileName(params.fileName)
  handleBar.setTemplateParams(params.templateParams)
  const template = handleBar.createTemplate()

  return {
    template: template(handleBar.templateParams),
  }
}

export function createTemplate(this: any): any {
  // Open template file
  const source = fs.readFileSync(
    path.join(__dirname, `/templates/${this.fileName}.hbs`),
    'utf8'
  )
  // Create email generator
  return Handlebars.compile(source)
}

export function setFileName(this: any, fileName: HbsTemplateFiles): void {
  this.fileName = fileName
}

export function HandleBarTemplate<T>(language: SUPPORTED_LANGUAGES) {
  let fileName = ''
  let templateParams: T

  i18next.changeLanguage(language).then(() => {})

  Handlebars.registerHelper('I18n', function (str) {
    //If two parameters passed for I18n then concat second paramenter to first one
    if (arguments.length > 2) {
      str = str + arguments[1]
    }

    return i18next != undefined ? i18next.t(str, arguments) : str
  })

  Handlebars.registerHelper('UPPER', function (str) {
    return str.toUpperCase()
  })

  Handlebars.registerHelper('eq', (a, b) => a == b)

  Handlebars.registerHelper('Time', function (date) {
    const dateObj = new Date(date)

    return dateObj.toLocaleTimeString('de-DE', {
      timeZone: 'Europe/Helsinki',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  })

  Handlebars.registerHelper('Date', function (date) {
    if (typeof date === 'undefined') {
      const dateObj = new Date()

      return dateObj.toLocaleDateString('de-DE', {
        timeZone: 'Europe/Helsinki',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    }

    const dateObj = new Date(date)
    return dateObj.toLocaleDateString('de-DE', {
      timeZone: 'Europe/Helsinki',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  })

  Handlebars.registerHelper(
    'ChangeLng',
    function (language: SUPPORTED_LANGUAGES) {
      i18next.changeLanguage(language).then(() => {})
    }
  )

  Handlebars.registerHelper('ParseDateTime', function (date) {
    if (typeof date === 'undefined') {
      const dateObj = new Date()
      return (
        dateObj.toLocaleDateString('de-DE', {
          timeZone: 'Europe/Helsinki',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }) +
        ' ' +
        dateObj.toLocaleTimeString('de-DE', {
          timeZone: 'Europe/Helsinki',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      )
    }

    // Example date string 20210901-05184
    const year = date.substring(0, 4)
    // Minus one because js month starts at 0 not 01.
    const month = date.substring(4, 6) - 1
    const day = date.substring(6, 8)
    const hours = date.substring(9, 11)
    const minutes = date.substring(11, 13)
    const seconds = date.substring(13, 15)

    const dateObj = new Date(
      Date.UTC(year, month, day, hours, minutes, seconds)
    )

    return (
      dateObj.toLocaleDateString('de-DE', {
        timeZone: 'Europe/Helsinki',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }) +
      ' ' +
      dateObj.toLocaleTimeString('de-DE', {
        timeZone: 'Europe/Helsinki',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    )
  })

  const partialsDir = `${__dirname}${path.sep}templates${path.sep}partials`

  const filenames = fs.readdirSync(partialsDir)

  filenames.forEach(function (filename: string) {
    const matches = /^([^.]+).hbs$/.exec(filename)
    if (!matches) {
      return
    }
    const name = matches[1] || ''
    const template = fs.readFileSync(partialsDir + '/' + filename, 'utf8')
    Handlebars.registerPartial(name, template)
  })

  return {
    createTemplate,
    fileName,
    setFileName,
    setTemplateParams(params: T) {
      templateParams = params
    },
    get templateParams(): T {
      return templateParams
    },
  }
}
