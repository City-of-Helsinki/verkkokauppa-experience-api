import type i18default from "i18next";
const i18next: typeof i18default = require("i18next");
const en = require( "../translations/en.json");
const fi = require( "../translations/fi.json");
const sv = require( "../translations/sv.json");

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
        fallbackLng: 'fi'
    }).then(() => {})

export default i18next;