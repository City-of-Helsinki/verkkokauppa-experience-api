export type ProductAccounting = {
  productId: string
  vatCode: string
  internalOrder: string
  profitCenter: string
  balanceProfitCenter: string
  project: string
  operationArea: string
  companyCode: string
  mainLedgerAccount: string
  activeFrom?: string
  nextEntity?: {
    companyCode: string
    mainLedgerAccount: string
    vatCode: string
    internalOrder: string
    profitCenter: string
    balanceProfitCenter: string
    project: string
    operationArea: string
  }
}
