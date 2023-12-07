import axios from 'axios'
import { sendRefundConfirmationEmail } from './service'
jest.mock('axios')
const axiosMock = axios as jest.Mocked<typeof axios>

describe('sendRefundConfirmationEmail', () => {
  it('Should generate correct email body', async () => {
    const refund = {
      refund: {
        refundId: 'rid1',
      },
      items: [
        {
          orderItemId: 'oiid1',
          productLabel: 'pl1',
          productName: 'pn1',
          priceGross: '124',
          unit: 'pcs',
          productDescription: 'pd1',
          quantity: 1,
          vatPercentage: '24',
          rowPriceTotal: '124',
          rowPriceVat: '24',
        },
        {
          orderItemId: 'oiid2',
          productLabel: 'pl2',
          productName: 'pn2',
          priceGross: '248',
          unit: 'pcs',
          productDescription: 'pd2',
          quantity: 1,
          vatPercentage: '24',
          rowPriceTotal: '248',
          rowPriceVat: '48',
        },
        {
          orderItemId: 'oiid3',
          productLabel: 'pl3',
          productName: 'pn3',
          priceGross: '330',
          unit: 'pcs',
          productDescription: 'pd3',
          quantity: 1,
          vatPercentage: '10',
          rowPriceTotal: '330',
          rowPriceVat: '30',
        },
      ],
    }

    const order: any = {
      orderId: 'oid1',
      createdAt: '2023-12-04T17:02:13.077Z',
      items: [
        {
          orderItemId: 'oiid1',
          meta: [
            {
              label: 'mlabel1',
              value: 'mvalue1',
            },
          ],
        },
        {
          orderItemId: 'oiid2',
        },
        {
          orderItemId: 'oiid3',
          meta: [
            {
              label: 'mlabel2',
              value: 'mvalue2',
            },
            {
              label: 'mlabel3',
              value: 'mvalue3',
            },
          ],
        },
      ],
      customer: {
        firstName: 'fn1',
        lastName: 'ln1',
        email: 'e1',
        phone: 'p1',
        address: 'a1',
      },
    }

    const merchant = {
      merchantName: 'mn1',
      merchantStreet: 'ms1',
      merchantZip: 'mz1',
      merchantCity: 'mc1',
      merchantEmail: 'me1',
      merchantPhone: 'mp1',
      merchantBusinessId: 'mbid1',
    }

    const payment = {
      total: 1000,
    }

    process.env.MESSAGE_BACKEND_URL = 'http://localhost:8080'

    axiosMock.post.mockResolvedValue({ data: {} })

    await sendRefundConfirmationEmail({
      refund,
      payment,
      merchant,
      order,
    })

    expect(axiosMock.post.mock.calls[0]?.[1].body).toMatchSnapshot()
  })
})
