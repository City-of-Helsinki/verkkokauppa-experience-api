import type { EmailTemplateDto, HbsTemplateFiles } from './types'

import * as Handlebars from 'handlebars'
import i18next from './../../i18n/init'
import type { SUPPORTED_LANGUAGES } from '../../i18n/types'
import { parseTimestamp } from '@verkkokauppa/core'
import {
  localeDateStringWithHelsinkiTimeZone,
  localeDateTimeStringWithHelsinkiTimezone,
  localeTimeStringWithHelsinkiTimezone,
} from '../../service'

const fs = require('fs')
const path = require('path')

export const createEmailTemplate = async <T>(params: {
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

export const localDateStringFromDateTime = (
  datetime?: string
  // addTimeZone = true
) => {
  const date = datetime ? new Date(datetime) : new Date()

  if (isValidDate(date)) {
    const datePartsFromIsoString = date.toISOString().slice(0, 10).split('-')
    const [year, month, day] = datePartsFromIsoString

    return `${day}.${month}.${year}`
  }
  return ''
}

export const isValidDate = (date: any) =>
  date instanceof Date && date.toString() !== 'Invalid Date'

export const localTimeFromDateTime = (
  date: string | number | Date
  // addTimeZone = true
) => {
  const dateCreated = new Date(date)
  if (isValidDate(dateCreated) && dateCreated) {
    const isoParts = dateCreated.toISOString().split('T')
    if (isoParts.length > 0 && isoParts[1]) {
      const timePart = isoParts[1].split('Z')[0]
      if (timePart) {
        const timeParts = timePart.split('.')
        return timeParts[0] || ''
      }
      return ''
    }
    return ''
  } else {
    return ''
  }
}

export function HandleBarTemplate<T>(language: SUPPORTED_LANGUAGES) {
  let fileName = ''
  let templateParams: T

  i18next.changeLanguage(language).then(() => {})

  Handlebars.registerHelper('I18n', function (str) {
    //If two parameters passed for I18n then concat second paramenter to first one
    if (arguments.length > 2) {
      str = str + arguments[1]
      return i18next != undefined ? i18next.t(str, arguments[1]) : str
    }

    return i18next != undefined ? i18next.t(str, arguments) : str
  })

  Handlebars.registerHelper('UPPER', function (str) {
    return str.toUpperCase()
  })

  // KYV-575 gives number out as string with specified number of decimals
  Handlebars.registerHelper('toFixed', function (value, decimals) {
    const number = parseFloat(value)
    if (isNaN(number)) return '0,00'
    return Number(number).toFixed(decimals).replace('.', ',')
  })

  Handlebars.registerHelper('eq', (a, b) => a == b)

  Handlebars.registerHelper('Time', function (date) {
    return localTimeFromDateTime(date)
  })

  Handlebars.registerHelper('TimeEurope', function (date) {
    return localeTimeStringWithHelsinkiTimezone(date)
  })

  Handlebars.registerHelper('Date', function (date) {
    return localDateStringFromDateTime(date)
  })

  Handlebars.registerHelper('DateTimeEurope', function (date) {
    return localeDateTimeStringWithHelsinkiTimezone(date)
  })

  Handlebars.registerHelper('DateEurope', function (date) {
    return localeDateStringWithHelsinkiTimeZone(date)
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
        localDateStringFromDateTime(dateObj.toISOString()) +
        ' ' +
        localTimeFromDateTime(dateObj.toISOString())
      )
    }
    const dateObj = parseTimestamp(date)

    return localeDateTimeStringWithHelsinkiTimezone(dateObj.toISOString())
  })

  Handlebars.registerHelper('DateTime', function (date) {
    const dateObj = new Date(date)

    return (
      localDateStringFromDateTime(dateObj.toISOString()) +
      ' ' +
      localTimeFromDateTime(dateObj.toISOString())
    )
  })

  Handlebars.registerHelper('ifCond', function (v1, operator, v2, options) {
    switch (operator) {
      case '==':
        // @ts-ignore
        return v1 == v2 ? options.fn(this) : options.inverse(this)
      case '===':
        // @ts-ignore
        return v1 === v2 ? options.fn(this) : options.inverse(this)
      case '!=':
        // @ts-ignore
        return v1 != v2 ? options.fn(this) : options.inverse(this)
      case '!==':
        // @ts-ignore
        return v1 !== v2 ? options.fn(this) : options.inverse(this)
      case '<':
        // @ts-ignore
        return v1 < v2 ? options.fn(this) : options.inverse(this)
      case '<=':
        // @ts-ignore
        return v1 <= v2 ? options.fn(this) : options.inverse(this)
      case '>':
        // @ts-ignore
        return v1 > v2 ? options.fn(this) : options.inverse(this)
      case '>=':
        // @ts-ignore
        return v1 >= v2 ? options.fn(this) : options.inverse(this)
      case '&&':
        // @ts-ignore
        return v1 && v2 ? options.fn(this) : options.inverse(this)
      case '||':
        // @ts-ignore
        return v1 || v2 ? options.fn(this) : options.inverse(this)
      case 'length':
        // @ts-ignore
        return v1?.length > v2 ? options.fn(this) : options.inverse(this)
      default:
        // @ts-ignore
        return options.inverse(this)
    }
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
