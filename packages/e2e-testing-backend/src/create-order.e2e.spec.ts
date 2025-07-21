import {
  callPaytrailWithCardPayment,
  callPaytrailWithFormData,
  confirmTestOrderAndCreatePayment,
  createAndInitializeNamespace,
  createTestOrder,
  generateTestUUIDv4,
  loadLocalEnv,
  selectTestPaymentMethod,
  skipIfNotLocalTest,
  sleep,
} from './helpers/namespace-helper'
import axios from 'axios'
import {
  getOrderAdmin,
  OrderAccounting,
  OrderAccountingItem,
} from '@verkkokauppa/order-backend'
import {
  getPaymentForOrderAdmin,
  PaymentStatus,
} from '@verkkokauppa/payment-backend'
import { searchAndExtractResults } from './helpers/elasticSearchTesting'

beforeAll(() => {
  loadLocalEnv()
})

describe('Namespace Helper Functions (Integration Tests)', () => {
  const namespace = 'testnamespace'
  skipIfNotLocalTest()

  // Using `conditionalTest` to skip or run tests based on the condition
  it('should create a namespace successfully', async () => {
    const initedNamespace = await createAndInitializeNamespace({ namespace })
    expect(initedNamespace).toBeTruthy()
    console.log(initedNamespace.kassaUrl)

    const user = generateTestUUIDv4()

    axios.defaults.headers.common['user'] = user

    const createdOrder = await createTestOrder({
      user: user,
      namespace: initedNamespace.namespace,
      customer: {
        email: 'email@gmail.com',
        firstName: 'firstName',
        lastName: 'lastName',
        phone: '+358401234567',
      },
      items: [
        {
          productId: initedNamespace.internalProduct.id,
          productName: initedNamespace.internalProduct.name,
          quantity: 1,
          unit: 'pcs',
          rowPriceNet: initedNamespace.createdPrice.netValue,
          rowPriceVat: initedNamespace.createdPrice.vatValue,
          rowPriceTotal: initedNamespace.createdPrice.grossValue,
          priceNet: initedNamespace.createdPrice.netValue,
          priceGross: initedNamespace.createdPrice.grossValue,
          priceVat: initedNamespace.createdPrice.vatValue,
          vatPercentage: initedNamespace.createdPrice.vatPercentage,
          merchantId: initedNamespace.merchant.merchantId,
        },
        {
          productId: initedNamespace.internalProduct.id,
          productName: initedNamespace.internalProduct.name,
          quantity: 1,
          unit: 'pcs',
          rowPriceNet: initedNamespace.createdPrice.netValue,
          rowPriceVat: initedNamespace.createdPrice.vatValue,
          rowPriceTotal: initedNamespace.createdPrice.grossValue,
          priceNet: initedNamespace.createdPrice.netValue,
          priceGross: initedNamespace.createdPrice.grossValue,
          priceVat: initedNamespace.createdPrice.vatValue,
          vatPercentage: initedNamespace.createdPrice.vatPercentage,
          merchantId: initedNamespace.merchant.merchantId,
        },
      ],
    })

    console.log(createdOrder)
    const paymentMethod = {
      name: 'OP',
      code: 'osuuspankki',
      group: 'bank',
      img:
        'https://resources.paytrail.com/images/payment-method-logos/osuuspankki.png',
      gateway: 'online-paytrail',
    }
    const orderId = createdOrder.orderId
    const selectedPaymentMethod = await selectTestPaymentMethod({
      orderId,
      paymentMethod,
    })
    console.log(selectedPaymentMethod)

    const confirmedOrder = await confirmTestOrderAndCreatePayment({
      orderId,
      paymentMethod: selectedPaymentMethod.code,
      language: 'fi',
      gateway: selectedPaymentMethod.gateway,
    })
    console.log(JSON.stringify(confirmedOrder, null, 4))
    const responseFromPaytrail = await callPaytrailWithFormData(confirmedOrder)
    console.log(responseFromPaytrail)
    const orderByAdmin = await getOrderAdmin({ orderId })
    await sleep(10 * 1000)
    expect(orderByAdmin.status).toEqual('confirmed')
    const payment = await getPaymentForOrderAdmin({ orderId })
    console.log(JSON.stringify(payment, null, 4))
    expect(payment.status).toEqual(PaymentStatus.PAID_ONLINE)

    // Call the utility function with the index, query, and expected result type
    const query = {
      match: { orderId: createdOrder.orderId },
    }

    const orderAccountings = await searchAndExtractResults<OrderAccounting>(
      'orderaccountings',
      query
    )

    console.log(orderAccountings)
    expect(orderAccountings.length).toEqual(1)
    expect(orderAccountings[0]?.orderId).toEqual(createdOrder.orderId)

    const orderItemAccountings = await searchAndExtractResults<OrderAccountingItem>(
      'orderitemaccountings',
      query
    )

    // Sort the orderItemAccountings by orderItemId
    orderItemAccountings.sort((a, b) => {
      return a.orderItemId.localeCompare(b.orderItemId) // Assuming orderItemId is a string; for numbers, use a - b
    })

    orderItemAccountings.map((value) => {
      value.paidAt = value.paidAt.slice(0, -4) // trims 4 chars from timestamp
    })
    // Sort the createdOrder items by orderItemId
    const sortedOrderItems = createdOrder.items.sort((a, b) => {
      return a.orderItemId.localeCompare(b.orderItemId) // Same as above
    })

    console.log(orderItemAccountings)
    expect(orderItemAccountings.length).toEqual(2)
    expect(orderItemAccountings[0]?.orderId).toEqual(createdOrder.orderId)
    expect(orderItemAccountings[1]?.orderId).toEqual(createdOrder.orderId)
    // Assert that the sorted orderItemAccountings match the expected output
    expect(orderItemAccountings).toEqual([
      {
        _class:
          'fi.hel.verkkokauppa.order.model.accounting.OrderItemAccounting',
        balanceProfitCenter:
          initedNamespace.productAccounting.balanceProfitCenter,
        companyCode: initedNamespace.productAccounting.companyCode,
        mainLedgerAccount:
          initedNamespace.productAccounting.nextEntity.mainLedgerAccount,
        merchantId: initedNamespace.merchant.merchantId,
        namespace: namespace,
        operationArea:
          initedNamespace.productAccounting.nextEntity.operationArea,
        orderId: sortedOrderItems[0]?.orderId, // Use the sorted items here
        orderItemId: sortedOrderItems[0]?.orderItemId,
        paidAt: payment?.paidAt?.slice(0, -3),
        paytrailTransactionId: payment.paytrailTransactionId,
        priceGross: sortedOrderItems[0]?.priceGross,
        priceNet: sortedOrderItems[0]?.priceNet,
        priceVat: sortedOrderItems[0]?.priceVat,
        project: initedNamespace.productAccounting.nextEntity.project,
        vatCode: initedNamespace.productAccounting.nextEntity.vatCode,
      },
      {
        _class:
          'fi.hel.verkkokauppa.order.model.accounting.OrderItemAccounting',
        balanceProfitCenter:
          initedNamespace.productAccounting.balanceProfitCenter,
        companyCode: initedNamespace.productAccounting.companyCode,
        mainLedgerAccount:
          initedNamespace.productAccounting.nextEntity.mainLedgerAccount,
        merchantId: initedNamespace.merchant.merchantId,
        namespace: namespace,
        operationArea:
          initedNamespace.productAccounting.nextEntity.operationArea,
        orderId: sortedOrderItems[1]?.orderId, // Use the sorted items here
        orderItemId: sortedOrderItems[1]?.orderItemId,
        paidAt: payment.paidAt?.slice(0, -3),
        paytrailTransactionId: payment.paytrailTransactionId,
        priceGross: sortedOrderItems[1]?.priceGross,
        priceNet: sortedOrderItems[1]?.priceNet,
        priceVat: sortedOrderItems[1]?.priceVat,
        project: initedNamespace.productAccounting.nextEntity.project,
        vatCode: initedNamespace.productAccounting.nextEntity.vatCode,
      },
    ])
  })

  // Using `conditionalTest` to skip or run tests based on the condition
  it('Should create namespace and then create order and pay it with card', async () => {
    const initedNamespace = await createAndInitializeNamespace({ namespace })
    expect(initedNamespace).toBeTruthy()
    console.log(initedNamespace.kassaUrl)

    const user = generateTestUUIDv4()

    axios.defaults.headers.common['user'] = user

    const createdOrder = await createTestOrder({
      user: user,
      namespace: initedNamespace.namespace,
      customer: {
        email: 'email@gmail.com',
        firstName: 'firstName',
        lastName: 'lastName',
        phone: '+358401234567',
      },
      items: [
        {
          productId: initedNamespace.internalProduct.id,
          productName: initedNamespace.internalProduct.name,
          quantity: 1,
          unit: 'pcs',
          rowPriceNet: initedNamespace.createdPrice.netValue,
          rowPriceVat: initedNamespace.createdPrice.vatValue,
          rowPriceTotal: initedNamespace.createdPrice.grossValue,
          priceNet: initedNamespace.createdPrice.netValue,
          priceGross: initedNamespace.createdPrice.grossValue,
          priceVat: initedNamespace.createdPrice.vatValue,
          vatPercentage: initedNamespace.createdPrice.vatPercentage,
          merchantId: initedNamespace.merchant.merchantId,
        },
        {
          productId: initedNamespace.internalProduct.id,
          productName: initedNamespace.internalProduct.name,
          quantity: 1,
          unit: 'pcs',
          rowPriceNet: initedNamespace.createdPrice.netValue,
          rowPriceVat: initedNamespace.createdPrice.vatValue,
          rowPriceTotal: initedNamespace.createdPrice.grossValue,
          priceNet: initedNamespace.createdPrice.netValue,
          priceGross: initedNamespace.createdPrice.grossValue,
          priceVat: initedNamespace.createdPrice.vatValue,
          vatPercentage: initedNamespace.createdPrice.vatPercentage,
          merchantId: initedNamespace.merchant.merchantId,
        },
      ],
    })

    console.log(createdOrder)
    const paymentMethod = {
      name: 'Visa',
      code: 'creditcard',
      group: 'creditcard',
      img:
        'https://resources.paytrail.com/images/payment-method-logos/visa.png',
      gateway: 'online-paytrail',
    }
    const orderId = createdOrder.orderId
    const selectedPaymentMethod = await selectTestPaymentMethod({
      orderId,
      paymentMethod,
    })
    console.log(selectedPaymentMethod)

    const confirmedOrder = await confirmTestOrderAndCreatePayment({
      orderId,
      paymentMethod: selectedPaymentMethod.code,
      language: 'fi',
      gateway: selectedPaymentMethod.gateway,
    })
    console.log(JSON.stringify(confirmedOrder, null, 4))
    const successUrl = await callPaytrailWithCardPayment(confirmedOrder)
    console.log(successUrl)
    expect(successUrl).toContain(
      `${confirmedOrder.orderId}/success?user=${confirmedOrder.userId}`
    )
    const orderByAdmin = await getOrderAdmin({ orderId })
    await sleep(10 * 1000)
    expect(orderByAdmin.status).toEqual('confirmed')
    const payment = await getPaymentForOrderAdmin({ orderId })
    console.log(JSON.stringify(payment, null, 4))
    expect(payment.status).toEqual(PaymentStatus.PAID_ONLINE)

    // Call the utility function with the index, query, and expected result type
    const query = {
      match: { orderId: createdOrder.orderId },
    }

    const orderAccountings = await searchAndExtractResults<OrderAccounting>(
      'orderaccountings',
      query
    )

    console.log(orderAccountings)
    expect(orderAccountings.length).toEqual(1)
    expect(orderAccountings[0]?.orderId).toEqual(createdOrder.orderId)

    const orderItemAccountings = await searchAndExtractResults<OrderAccountingItem>(
      'orderitemaccountings',
      query
    )

    // Sort the orderItemAccountings by orderItemId
    orderItemAccountings.sort((a, b) => {
      return a.orderItemId.localeCompare(b.orderItemId) // Assuming orderItemId is a string; for numbers, use a - b
    })

    orderItemAccountings.map((value) => {
      value.paidAt = value.paidAt.slice(0, -4) // trims 4 chars from timestamp
    })
    // Sort the createdOrder items by orderItemId
    const sortedOrderItems = createdOrder.items.sort((a, b) => {
      return a.orderItemId.localeCompare(b.orderItemId) // Same as above
    })

    console.log(orderItemAccountings)
    expect(orderItemAccountings.length).toEqual(2)
    expect(orderItemAccountings[0]?.orderId).toEqual(createdOrder.orderId)
    expect(orderItemAccountings[1]?.orderId).toEqual(createdOrder.orderId)
    // Assert that the sorted orderItemAccountings match the expected output
    expect(orderItemAccountings).toEqual([
      {
        _class:
          'fi.hel.verkkokauppa.order.model.accounting.OrderItemAccounting',
        balanceProfitCenter:
          initedNamespace.productAccounting.balanceProfitCenter,
        companyCode: initedNamespace.productAccounting.companyCode,
        mainLedgerAccount:
          initedNamespace.productAccounting.nextEntity.mainLedgerAccount,
        merchantId: initedNamespace.merchant.merchantId,
        namespace: namespace,
        operationArea:
          initedNamespace.productAccounting.nextEntity.operationArea,
        orderId: sortedOrderItems[0]?.orderId, // Use the sorted items here
        orderItemId: sortedOrderItems[0]?.orderItemId,
        paidAt: payment?.paidAt?.slice(0, -3),
        paytrailTransactionId: payment.paytrailTransactionId,
        priceGross: sortedOrderItems[0]?.priceGross,
        priceNet: sortedOrderItems[0]?.priceNet,
        priceVat: sortedOrderItems[0]?.priceVat,
        project: initedNamespace.productAccounting.nextEntity.project,
        vatCode: initedNamespace.productAccounting.nextEntity.vatCode,
      },
      {
        _class:
          'fi.hel.verkkokauppa.order.model.accounting.OrderItemAccounting',
        balanceProfitCenter:
          initedNamespace.productAccounting.balanceProfitCenter,
        companyCode: initedNamespace.productAccounting.companyCode,
        mainLedgerAccount:
          initedNamespace.productAccounting.nextEntity.mainLedgerAccount,
        merchantId: initedNamespace.merchant.merchantId,
        namespace: namespace,
        operationArea:
          initedNamespace.productAccounting.nextEntity.operationArea,
        orderId: sortedOrderItems[1]?.orderId, // Use the sorted items here
        orderItemId: sortedOrderItems[1]?.orderItemId,
        paidAt: payment.paidAt?.slice(0, -3),
        paytrailTransactionId: payment.paytrailTransactionId,
        priceGross: sortedOrderItems[1]?.priceGross,
        priceNet: sortedOrderItems[1]?.priceNet,
        priceVat: sortedOrderItems[1]?.priceVat,
        project: initedNamespace.productAccounting.nextEntity.project,
        vatCode: initedNamespace.productAccounting.nextEntity.vatCode,
      },
    ])
  })
})
