declare module 'visma-pay' {
  class PaymentError {
    message: string
    type: string
  }
  type Params = {
    RETURN_CODE: string
    AUTHCODE: string
    ORDER_NUMBER: string
    SETTLED: string
    CONTACT_ID?: string
    INCIDENT_ID?: string
  }
  interface CheckReturnCallback {
    (error: PaymentError | null, result: Params): void
  }
  class Payment {
    setApiKey(p: string): void
    setPrivateKey(p: string): void
    checkReturn(params: Params, callback: CheckReturnCallback): void
  }
  export = Payment
}
