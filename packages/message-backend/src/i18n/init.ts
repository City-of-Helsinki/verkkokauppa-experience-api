import type i18default from 'i18next'
const i18next: typeof i18default = require('i18next')
import * as fi from '../translations/fi.json'
import * as en from '../translations/en.json'
import * as sv from '../translations/sv.json'

i18next
  .init({
    interpolation: {
      escapeValue: false,
    },
    lng: 'fi',
    resources: {
      fi: { translation: fi },
      en: { translation: en },
      sv: { translation: sv },
    },
    fallbackLng: 'fi',
  })
  .then(() => {})

export default i18next
