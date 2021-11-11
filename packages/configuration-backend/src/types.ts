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

export type PublicServiceConfigurationKeys = {
  TERMS_OF_USE_URL: string
  TERMS_OF_USE_EMBEDDABLE_CONTENT: string
  ORDER_CREATED_REDIRECT_URL: string
  ORDER_SUCCESS_REDIRECT_URL: string
  ORDER_CANCEL_REDIRECT_URL: string
  PAYMENT_API_VERSION: string
  PAYMENT_RETURN_URL: string
  PAYMENT_NOTIFICATION_URL: string
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
