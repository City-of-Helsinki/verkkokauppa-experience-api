export type MerchantConfigurationKeys = {
  merchantName: string
  merchantStreet: string
  merchantZip: string
  merchantCity: string
  merchantEmail: string
  merchantPhone: string
  merchantUrl: string
  merchantTermsOfServiceUrl: string
  merchantBusinessId: string
  // Merchant restricted values
  merchantPaymentWebhookUrl: string
}

export type MerchantKeys = {
  merchantName: string
  merchantStreet: string
  merchantZip: string
  merchantCity: string
  merchantEmail: string
  merchantUrl: string
  merchantTermsOfServiceUrl: string
  merchantBusinessId: string
  merchantPhone?: string
}

export type PublicServiceConfigurationKeys = {
  TERMS_OF_USE_URL: string
  TERMS_OF_USE_EMBEDDABLE_CONTENT: string
  ORDER_CREATED_REDIRECT_URL: string
  ORDER_SUCCESS_REDIRECT_URL: string
  ORDER_CANCEL_REDIRECT_URL: string
  PAYMENT_API_VERSION: string
  PAYMENT_RETURN_URL: string
  PAYMENT_NOTIFICATION_URL: string
  merchantSubscriptionTermsOfServiceUrl: string
} & MerchantConfigurationKeys

export type RestrictedServiceConfigurationKeys = {
  PAYMENT_API_VERSION: string
  PAYMENT_API_KEY: string
  PAYMENT_CURRENCY: string
  PAYMENT_TYPE: string
  PAYMENT_REGISTER_CARD_TOKEN: string
  PAYMENT_RETURN_URL: string
  PAYMENT_NOTIFICATION_URL: string
  PAYMENT_LANGUAGE: string
  PAYMENT_SUBMERCHANT_ID: string
  PAYMENT_CP: string
  // Merchant
  merchantPaymentWebhookUrl: string
}

export interface ServiceConfiguration {
  configurationId: string
  namespace: string
  configurationKey:
    | keyof PublicServiceConfigurationKeys
    | keyof RestrictedServiceConfigurationKeys
  configurationValue: string
  restricted: boolean
}

export interface Namespace {
  namespaceId?: string
  namespace: string
  createdAt?: string
  updatedAt?: string
  configurations: Configuration[]
}

export interface Merchant {
  merchantId?: string
  namespace: string
  createdAt?: string
  updatedAt?: string
  configurations: Configuration[]
}

export interface Configuration {
  key: string
  value: string
  restricted?: boolean
  locale?: Locale
}

export interface Locale {
  fi: string
  sv: string
  en: string
}
