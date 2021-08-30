import type { EmailTemplateDto } from './types'

import * as Handlebars from "handlebars"
import type { HbsTemplateFiles } from "./types";
import type { OrderConfirmationEmailParameters } from "./types";
import i18next from "../i18n/init";
import type { SUPPORTED_LANGUAGES } from "../i18n/types";

const fs = require("fs");
const path = require('path');

export const createOrderConfirmationEmailTemplate = async<T> (
    params: T & { fileName: HbsTemplateFiles, templateParams: OrderConfirmationEmailParameters[] }
): Promise<EmailTemplateDto> => {
  const handleBar = HandleBarTemplate<OrderConfirmationEmailParameters>("fi");
  const files = fs.readdirSync(path.join(__dirname, `/templates/`));

  if (!files.includes(params.fileName)) {
    return {
      template: '',
      error: 'Email template cant be found'
    };
  }
  handleBar.setFileName(params.fileName);
  handleBar.setTemplateParams(params.templateParams);
  const template = handleBar.createTemplate();

  return {
    template: template(handleBar.templateParams)
  };
}

export function createTemplate(this: any): HandlebarsTemplateDelegate {
  // Open template file
  const source = fs.readFileSync(path.join(__dirname, `/templates/${this.fileName}.hbs`), 'utf8');
  // Create email generator
  return Handlebars.compile(source);
}

export function setFileName(this: any, fileName: HbsTemplateFiles): void {
  this.fileName = fileName;
}

export function HandleBarTemplate<T>(language: SUPPORTED_LANGUAGES){
  let fileName = '';
  let templateParams: T[] = [];

  i18next.changeLanguage(language).then(() => {});
  Handlebars.registerHelper('I18n',
      function(str){
        return (i18next != undefined ? i18next.t(str) : str);
      }
  );
  return {
    createTemplate,
    fileName,
    setFileName,
    setTemplateParams(params: T[]) {
      templateParams = params
    },
    get templateParams(): T[] {
      return templateParams;
    }
  }
}