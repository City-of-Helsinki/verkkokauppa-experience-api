import {
  createAndInitializeNamespace,
  createTestOrder,
  loadLocalEnv,
  skipIfNotLocalTest,
} from './helpers/namespace-helper'
import axios from 'axios'
import { webkit } from 'playwright'

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

    // const user = generateTestUUIDv4()
    // 010190-905V: Tenho Testilä (both addresses in Helsinki) -> auto FOU-143
    const user = 'b49d3ae3-6167-4850-84ac-6b98188ef0f4'
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

    const browser = await webkit.launch({ headless: false })
    const context = await browser.newContext()
    const page = await context.newPage()

    // await page.goto(loginUrl)
    // await page.goto(
    //   `https://localhost:3000/profile/${createdOrder.orderId}/login`
    // )
    // await page.goto(
    //   `https://pysakoinninverkkokauppa-frontend-test.agw.arodevtest.hel.fi/`
    // )
    console.log(createdOrder.loggedInCheckoutUrl)
    await page.goto(createdOrder.loggedInCheckoutUrl)
    console.log(await page.title()) // Debug page title

    // Debug any console errors
    page.on('console', (msg) => console.log(msg.text()))

    // await browser.()
  })
})
