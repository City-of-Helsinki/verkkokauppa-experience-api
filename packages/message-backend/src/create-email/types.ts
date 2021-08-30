export interface EmailTemplateCreatePayload {
  orderId: string
  emailMessageType: "orderConfirmation"
}

export interface EmailTemplateDto {
  template: string
  error?: string
}

export interface EmailHandler {
  createTemplate(): string;
}

export interface EmailTemplateDto {
  template: string
  error?: string
}

export interface OrderConfirmationEmailParameters {
  headingHeader: string;
  receiptHeader: string;
  orderHeader: string;
  merchantHeader: string;
  headingDetails?: (HeadingDetailsEntity) | null;
  receiptDetails?: (ReceiptDetailsEntity)[] | null;
  orderDetails?: (DescriptionEntity)[] | null;
  merchantDetails?: (DescriptionEntity)[] | null;
}

export interface ReceiptDetailsEntity {
  description: string;
  fieldValue: string;
  bold?: boolean | null;
  className?: string | null;
}

export interface HeadingDetailsEntity {
  orderId: string;
  endDate: string;
  service: string;
  serviceProvider: string;
  serviceProviderUrl: string;
  bold?: boolean | null;
  className?: string | null;
}

export interface DescriptionEntity {
  description: string;
  bold?: boolean | null;
  className?: string | null;
}

export type HbsTemplateFiles = 'orderConfirmation'