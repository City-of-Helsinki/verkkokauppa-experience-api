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
  receipt_header: string;
  order_header: string;
  merchant_header: string;
  receipt_details?: (ReceiptDetailsEntity)[] | null;
  order_details?: (DescriptionEntity)[] | null;
  merchant_details?: (DescriptionEntity)[] | null;
}

export interface ReceiptDetailsEntity {
  description: string;
  fieldValue: string;
  bold?: boolean | null;
  className?: string | null;
}

export interface DescriptionEntity {
  description: string;
  bold?: boolean | null;
  className?: string | null;
}

export type HbsTemplateFiles = 'orderConfirmation'