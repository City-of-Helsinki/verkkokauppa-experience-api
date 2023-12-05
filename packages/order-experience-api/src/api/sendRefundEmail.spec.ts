import type { Response } from 'express'
import { SendRefundEmailController } from './sendRefundEmail'
import type { ValidatedRequest } from '@verkkokauppa/core'

jest.mock('@verkkokauppa/order-backend')
jest.mock('@verkkokauppa/payment-backend')
jest.mock('@verkkokauppa/configuration-backend')
jest.mock('@verkkokauppa/message-backend', () => {
  const original = jest.requireActual('@verkkokauppa/message-backend')
  return {
    __esModule: true,
    ...original,
    sendEmail: jest.fn(),
  }
})

const getRefundAdminMock = require('@verkkokauppa/order-backend').getRefundAdmin.mockImplementation(
  () => {}
)

const getOrderAdminMock = require('@verkkokauppa/order-backend').getOrderAdmin.mockImplementation(
  () => {}
)

const getMerchantDetailsWithNamespaceAndMerchantIdMock = require('@verkkokauppa/configuration-backend').getMerchantDetailsWithNamespaceAndMerchantId.mockImplementation(
  () => {}
)

const sendEmailMock = require('@verkkokauppa/message-backend').sendEmail.mockImplementation(
  () => undefined
)

const getRefundPaymentForOrderAdminMock = require('@verkkokauppa/payment-backend').getRefundPaymentForOrderAdmin.mockImplementation(
  () => {}
)

const controller = new (class extends SendRefundEmailController {
  implementation(req: ValidatedRequest<any>, res: Response): Promise<any> {
    return super.implementation(req, res)
  }
})()

const mockJson = jest.fn()
const mockResponse = ({
  status: () => ({ json: mockJson }),
} as any) as Response

beforeEach(() => {
  jest.clearAllMocks()
})

describe('Test SendRefundEmailController', () => {
  const mockRequest = {
    params: {
      refundId: 'rid1',
    },
    headers: {
      'api-key': 'ak1',
    },
    query: {},
  }
  it('Should generate correct email body', async () => {
    getRefundAdminMock.mockImplementationOnce(() => ({
      refund: { orderId: 'oid1' },
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
    }))

    getOrderAdminMock.mockImplementationOnce(() => ({
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
    }))

    getMerchantDetailsWithNamespaceAndMerchantIdMock.mockImplementationOnce(
      () => ({
        merchantName: 'mn1',
        merchantStreet: 'ms1',
        merchantZip: 'mz1',
        merchantCity: 'mc1',
        merchantEmail: 'me1',
        merchantPhone: 'mp1',
        merchantBusinessId: 'mbid1',
      })
    )

    getRefundPaymentForOrderAdminMock.mockImplementationOnce(() => ({
      total: '1000',
    }))

    await controller.implementation(mockRequest, mockResponse)

    expect(sendEmailMock).toHaveBeenCalledTimes(1)
    expect(sendEmailMock.mock.calls[0][0].body.replace(/\s+/g, '')).toEqual(
      '<!DOCTYPEhtmlPUBLIC"-//W3C//DTDXHTML1.0Transitional//EN""http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><htmlxmlns="http://www.w3.org/1999/xhtml"><head><metaname="viewport"content="width=device-width,initial-scale=1.0"/><metaname="x-apple-disable-message-reformatting"/><metahttp-equiv="Content-Type"content="text/html;charset=UTF-8"/><metaname="color-scheme"content="lightdark"/><metaname="supported-color-schemes"content="lightdark"/><title></title><styletype="text/css"rel="stylesheet"media="all">/*Base------------------------------*/@importurl("https://fonts.googleapis.com/css?family=Nunito+Sans:400,700&display=swap");body{width:100%!important;height:100%;margin:0;-webkit-text-size-adjust:none;}a{color:#3869D4;}aimg{border:none;}td{word-break:break-word;}.preheader{display:none!important;visibility:hidden;mso-hide:all;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;}/*Type------------------------------*/body,td,th{font-family:"NunitoSans",Helvetica,Arial,sans-serif;}h1{margin-top:0;color:#333333;font-size:22px;font-weight:bold;text-align:left;}h2{margin-top:0;color:#333333;font-size:16px;font-weight:bold;text-align:left;}h3{margin-top:0;color:#333333;font-size:14px;font-weight:bold;text-align:left;}td,th{font-size:16px;}p,ul,ol,blockquote{margin:.4em01.1875em;font-size:16px;line-height:1.625;}hr{border:0px;border-bottom:2pxsolid#000;}p.sub{font-size:13px;}/*Utilities------------------------------*/.align-right{text-align:right;}.align-left{text-align:left;}.align-center{text-align:center;}/*Buttons------------------------------*/.button{background-color:#3869D4;border-top:10pxsolid#3869D4;border-right:18pxsolid#3869D4;border-bottom:10pxsolid#3869D4;border-left:18pxsolid#3869D4;display:inline-block;color:#FFF;text-decoration:none;border-radius:3px;box-shadow:02px3pxrgba(0,0,0,0.16);-webkit-text-size-adjust:none;box-sizing:border-box;}.button--green{background-color:#22BC66;border-top:10pxsolid#22BC66;border-right:18pxsolid#22BC66;border-bottom:10pxsolid#22BC66;border-left:18pxsolid#22BC66;}.button--red{background-color:#FF6136;border-top:10pxsolid#FF6136;border-right:18pxsolid#FF6136;border-bottom:10pxsolid#FF6136;border-left:18pxsolid#FF6136;}@mediaonlyscreenand(max-width:500px){.button{width:100%!important;text-align:center!important;}}/*Attributelist------------------------------*/.attributes{margin:0021px;}.attributes_content{padding:16px;}.attributes_item{padding:0;}/*RelatedItems------------------------------*/.related{width:100%;margin:0;padding:25px000;-premailer-width:100%;-premailer-cellpadding:0;-premailer-cellspacing:0;}.related_item{padding:10px0;color:#CBCCCF;font-size:16px;line-height:18px;}.related_item-title{display:block;margin:.5em00;}.related_item-thumb{display:block;padding-bottom:10px;}.related_heading{border-top:1pxsolid#CBCCCF;text-align:center;padding:25px010px;}/*DiscountCode------------------------------*/.discount{width:100%;margin:0;padding:24px;-premailer-width:100%;-premailer-cellpadding:0;-premailer-cellspacing:0;-premailer-cellspacing:0;border:2pxdashed#CBCCCF;}.discount_heading{text-align:center;}.discount_body{text-align:center;font-size:16px;}/*SocialIcons------------------------------*/.social{width:auto;}.socialtd{padding:0;width:auto;}.social_icon{height:20px;margin:08px10px8px;padding:0;}/*Datatable------------------------------*/.purchase{width:100%;margin:0;padding:0;-premailer-width:100%;-premailer-cellpadding:0;-premailer-cellspacing:0;}.purchase_content{width:100%;margin:0;padding:10px000;-premailer-width:100%;-premailer-cellpadding:0;-premailer-cellspacing:0;}.purchase_item{padding:2px0;color:black;font-size:16px;line-height:18px;}.purchase_item_divider{margin:20px0px20px0px;border:0px;border-bottom:2pxdotted#ddd;}.purchase_heading{padding-bottom:8px;border-bottom:1pxsolid#EAEAEC;}.purchase_headingp{margin:0;color:#85878E;font-size:12px;}.purchase_footer{padding-top:16px;border-top:1pxsolid#EAEAEC;}.purchase_total{margin:0;text-align:right;font-weight:bold;color:#333333;}.purchase_total--label{padding:015px00;}body{color:#51545E;}p{color:#51545E;}p.sub{color:#6B6E76;}.email-wrapper{width:100%;margin:0;padding:0;-premailer-width:100%;-premailer-cellpadding:0;-premailer-cellspacing:0;}.email-content{width:100%;margin:0;padding:0;-premailer-width:100%;-premailer-cellpadding:0;-premailer-cellspacing:0;}/*Masthead-----------------------*/.email-masthead{padding:25px0;text-align:center;}.email-masthead_logo{width:94px;}.email-masthead_name{font-size:16px;font-weight:bold;color:#A8AAAF;text-decoration:none;text-shadow:01px0white;}/*Body------------------------------*/.email-body{width:100%;margin:0;padding:0;-premailer-width:100%;-premailer-cellpadding:0;-premailer-cellspacing:0;background-color:#FFFFFF;}.email-body_inner{width:570px;margin:0auto;padding:0;-premailer-width:570px;-premailer-cellpadding:0;-premailer-cellspacing:0;background-color:#FFFFFF;}.email-footer{width:570px;margin:0auto;padding:0;-premailer-width:570px;-premailer-cellpadding:0;-premailer-cellspacing:0;text-align:center;}.email-footerp{color:#6B6E76;}.body-action{width:100%;margin:30pxauto;padding:0;-premailer-width:100%;-premailer-cellpadding:0;-premailer-cellspacing:0;text-align:center;}.body-sub{margin-top:25px;padding-top:25px;border-top:1pxsolid#EAEAEC;}.content-cell{padding:10px35px;}/*MediaQueries------------------------------*/@mediaonlyscreenand(max-width:600px){.email-body_inner,.email-footer{width:100%!important;}}@media(prefers-color-scheme:dark){body,.email-body,.email-body_inner,.email-content,.email-wrapper,.email-masthead,.email-footer{background-color:#333333!important;color:#FFF!important;}p,ul,ol,blockquote,h1,h2,h3,span,.purchase_item{color:#FFF!important;}.attributes_content,.discount{background-color:#222!important;}.email-masthead_name{text-shadow:none!important;}}.no-wrap{white-space:nowrap;}.text-bold{font-weight:bold;}.pb-1{/*padding-bottom:1rem;*/border-bottom:1remsolidtransparent;}:root{color-scheme:lightdark;supported-color-schemes:lightdark;}</style><!--[ifmso]><styletype="text/css">.f-fallback{font-family:Arial,sans-serif;}</style><![endif]--></head><body><!--FI--><tableclass="email-wrapper"width="100%"cellpadding="0"cellspacing="0"role="presentation"><tr><tdalign="center"><tableclass="email-content"width="100%"cellpadding="0"cellspacing="0"role="presentation"><tr><tdclass="email-body"width="100%"cellpadding="0"cellspacing="0"><tableclass="email-body_inner"align="center"width="414"cellpadding="0"cellspacing="0"role="presentation"><tr><tdclass="content-cell"><divclass="f-fallback"><h1style="margin-bottom:0">Vahvistusjakuittimaksunpalautuksesta</h1><tableclass="purchase"width="100%"cellpadding="0"cellspacing="0"role="presentation"><tr><tdcolspan="2"><tableclass="purchase_content"width="100%"cellpadding="0"cellspacing="0"><tr><tdwidth="100%"class="purchase_itempb-1"><spanclass="f-fallback">Tilaukseesioid104.12.2023<br/>Tilausaika19:02ontehtymaksunpalautus.</span></td></tr></table></td></tr></table></div><divclass="f-fallbackpb-1"><h1style="margin-bottom:0">Palautuksentiedot</h1><tableclass="purchase"width="100%"cellpadding="0"cellspacing="0"role="presentation"><tr><tdcolspan="2"><tableclass="purchase_content"width="100%"cellpadding="0"cellspacing="0"><tr><tdwidth="100%"colspan="2"class="purchase_item"><h2>pl1</h2></td></tr><tr><tdwidth="80%"class="purchase_item"><spanclass="f-fallback"style="font-weight:bolder;">pn1</span></td><tdclass="align-right"width="20%"class="purchase_item"><spanclass="f-fallbackno-wrap">124€/kpl</span></td></tr><tr><tdwidth="80%"class="purchase_item"><spanclass="f-fallback"style="font-weight:normal;">pd1</span></td><tdclass="align-right"width="20%"class="purchase_item"><spanclass="f-fallbackno-wrap">&nbsp;</span></td></tr><tr><tdwidth="80%"class="purchase_item"><spanclass="f-fallback">1kplyhteensäSis.alv(24%)</span></td><tdclass="align-right"width="20%"class="purchase_itempb-1"><spanclass="f-fallbackno-wrap">124€</span></td></tr><tr><tdwidth="100%"class="purchase_item"style="padding-top:20px;"><spanclass="f-fallbackno-wrappb-1"style="font-size:16px;font-weight:600;">mlabel1</span></td></tr><tr><tdwidth="100%"class="purchase_item"><spanclass="f-fallbackno-wrappb-1"style="font-size:16px;">mvalue1</span></td></tr><tr><td><span>&emsp;</span></td></tr><tr><tdwidth="100%"colspan="2"class="purchase_item"><h2>pl2</h2></td></tr><tr><tdwidth="80%"class="purchase_item"><spanclass="f-fallback"style="font-weight:bolder;">pn2</span></td><tdclass="align-right"width="20%"class="purchase_item"><spanclass="f-fallbackno-wrap">248€/kpl</span></td></tr><tr><tdwidth="80%"class="purchase_item"><spanclass="f-fallback"style="font-weight:normal;">pd2</span></td><tdclass="align-right"width="20%"class="purchase_item"><spanclass="f-fallbackno-wrap">&nbsp;</span></td></tr><tr><tdwidth="80%"class="purchase_item"><spanclass="f-fallback">1kplyhteensäSis.alv(24%)</span></td><tdclass="align-right"width="20%"class="purchase_itempb-1"><spanclass="f-fallbackno-wrap">248€</span></td></tr><tr><td><span>&emsp;</span></td></tr><tr><tdwidth="100%"colspan="2"class="purchase_item"><h2>pl3</h2></td></tr><tr><tdwidth="80%"class="purchase_item"><spanclass="f-fallback"style="font-weight:bolder;">pn3</span></td><tdclass="align-right"width="20%"class="purchase_item"><spanclass="f-fallbackno-wrap">330€/kpl</span></td></tr><tr><tdwidth="80%"class="purchase_item"><spanclass="f-fallback"style="font-weight:normal;">pd3</span></td><tdclass="align-right"width="20%"class="purchase_item"><spanclass="f-fallbackno-wrap">&nbsp;</span></td></tr><tr><tdwidth="80%"class="purchase_item"><spanclass="f-fallback">1kplyhteensäSis.alv(10%)</span></td><tdclass="align-right"width="20%"class="purchase_itempb-1"><spanclass="f-fallbackno-wrap">330€</span></td></tr><tr><tdwidth="100%"class="purchase_item"style="padding-top:20px;"><spanclass="f-fallbackno-wrappb-1"style="font-size:16px;font-weight:600;">mlabel2</span></td></tr><tr><tdwidth="100%"class="purchase_item"><spanclass="f-fallbackno-wrappb-1"style="font-size:16px;">mvalue2</span></td></tr><tr><tdwidth="100%"class="purchase_item"style="padding-top:20px;"><spanclass="f-fallbackno-wrappb-1"style="font-size:16px;font-weight:600;">mlabel3</span></td></tr><tr><tdwidth="100%"class="purchase_item"><spanclass="f-fallbackno-wrappb-1"style="font-size:16px;">mvalue3</span></td></tr><tr><td><span>&emsp;</span></td></tr><tr><tdwidth="80%"class="purchase_item"style="border-top:1remsolidtransparent;"><spanclass="f-fallback">Palautetaanyhteensä</span></td><tdclass="align-right"width="20%"class="purchase_item"style="border-top:1remsolidtransparent;"><spanclass="f-fallbackno-wrap">1000€</span></td></tr><tr><tdwidth="80%"class="purchase_item"><spanclass="f-fallback">Sis.alv(10%)</span></td><tdclass="align-right"width="20%"class="purchase_item"><spanclass="f-fallbackno-wrap">30&euro;</span></td></tr><tr><tdwidth="80%"class="purchase_item"><spanclass="f-fallback">Sis.alv(24%)</span></td><tdclass="align-right"width="20%"class="purchase_item"><spanclass="f-fallbackno-wrap">72&euro;</span></td></tr></table></td></tr></table></div><divclass="f-fallback"><h1style="margin-bottom:0">Lisätietoapalautuksesta</h1><tableclass="purchase"width="100%"cellpadding="0"cellspacing="0"role="presentation"><tr><tdcolspan="2"><tableclass="purchase_content"width="100%"cellpadding="0"cellspacing="0"><trclass="pb-1"><tdwidth="100%"class="purchase_itempb-1"><spanclass="f-fallback">Saatammetarvitapalautustavartentilinumerosi.Tilinumeronilmoittaminentapahtuumaksunvälityspalveluntarjoajaltamme(PaytrailOyj)saapuvansähköpostinmukaisesti.Sähköpostiviestitoimitetaanosoitteestano-reply@paytrail.com.</span></td></tr><trclass="pb-1"><tdwidth="100%"class="purchase_itempb-1"><spanclass="f-fallback">Tilinumeroaeivoitoimittaavastaamallatähänviestiin.</span></td></tr><trclass="pb-1"><tdwidth="100%"class="purchase_itempb-1"><spanclass="f-fallback">Palautusmaksetaanautomaattisestitilauksellakäyttämällesimaksutavalle1–3pankkipäivänkuluessataitapauksissa,joissatarvitsemmetilinumerosiilmoittamallesipankkitilille1–3pankkipäivänkuluessatilinumeronilmoittamisesta.</span></td></tr><trclass="pb-1"><tdwidth="100%"class="purchase_item"><spanclass="f-fallback">Lisätietoamaksunpalautusprosessistaantaa:talpa.asiakaspalvelu@hel.fi</span></td></tr></table></td></tr></table></div></td></tr></table></td></tr><tr><tdclass="email-body"width="100%"cellpadding="0"cellspacing="0"><tableclass="email-body_inner"align="center"width="414"cellpadding="0"cellspacing="0"role="presentation"><tr><tdclass="content-cell"><divclass="f-fallback"><hr><h1style="margin-bottom:0;border-top:1remsolidtransparent;">Tilaajantiedot</h1><tableclass="purchase"width="100%"cellpadding="0"cellspacing="0"role="presentation"><tr><tdcolspan="2"><tableclass="purchase_content"width="100%"cellpadding="0"cellspacing="0"><tr><tdwidth="100%"class="purchase_item"><spanclass="f-fallback">fn1ln1</span></td></tr><tr><tdwidth="100%"class="purchase_item"><spanclass="f-fallback">e1</span></td></tr><tr><tdwidth="100%"class="purchase_item"><spanclass="f-fallback">p1</span></td></tr><tr><tdwidth="100%"class="purchase_item"><spanclass="f-fallback">a1</span></td></tr></table></td></tr></table></div></td></tr></table></td></tr><tr><tdclass="email-body"width="100%"cellpadding="0"cellspacing="0"><tableclass="email-body_inner"align="center"width="414"cellpadding="0"cellspacing="0"role="presentation"><tr><tdclass="content-cell"><divclass="f-fallback"><hr><h1style="margin-bottom:0;border-top:1remsolidtransparent;">Myyjäntiedot</h1><tableclass="purchase"width="100%"cellpadding="0"cellspacing="0"role="presentation"><tr><tdcolspan="2"><tableclass="purchase_content"width="100%"cellpadding="0"cellspacing="0"><tr><tdwidth="100%"class="purchase_item"><spanclass="f-fallback">mn1</span></td></tr><tr><tdwidth="100%"class="purchase_item"><spanclass="f-fallback">ms1</span></td></tr><tr><tdwidth="100%"class="purchase_item"><spanclass="f-fallback">mz1mc1</span></td></tr><tr><tdwidth="100%"class="purchase_item"><spanclass="f-fallback">me1</span></td></tr><tr><tdwidth="100%"class="purchase_item"><spanclass="f-fallback">mp1</span></td></tr><tr><tdwidth="100%"class="purchase_item"><spanclass="f-fallback">Y-tunnusmbid1</span></td></tr><tr><tdwidth="100%"class="purchase_item"><spanclass="f-fallback">Mikälisinullaonkysymyksiäliittyenmaksunpalautuksenperusteisiin,kohdistathannesuoraanmyyjälle.</span></td></tr></table></td></tr></table></div></td></tr></table></td></tr><tr><tdclass="email-body"width="100%"cellpadding="0"cellspacing="0"><tableclass="email-body_inner"align="center"width="414"cellpadding="0"cellspacing="0"role="presentation"><!--Bodycontent--><tr><tdclass="content-cell"><divclass="f-fallback"><imgalt="footer"style="width:600px;"src="data:image/png;base64,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FqTZ/xdX1N1zzz1ZSVpKYkn28ssvp1F5m266abYyM67OKyUTJ04MP/vZz8KcOXPSTHkXXHBBGDx4cBqVllgaxpWVV155ZZqpaOTIkaF///5pVHfiz3nPPfcMixYtSjPl3X777dlzbWjKSwAAoJQ48xIAAGgwixcvDq+//nqlxWU0efLkpavRaiqWl2+++WalxWUUf++ZM2emUemI28MWstpqq6W70vHNN9+E+++/v2BxGT399NPhs88+SyOiuBo4lpOFisvo5ptvrrAiGQAAoKlRXgIAAA2q2Haia6yxRrqruVh6/vvf/06jytW2GOX/ffHFF2HevHmhWbNmaaaiWCB/+OGHaUT01ltvhffeey+NKhe3PH777bfTCAAAoGlSXgIAAI1GXNlJ/YpbEsczGos967jN7QYbbJBGRJtvvnnYZJNN0qhyu+yyS+jSpUsaAQAANE3KSwAAAKqtdevWYcCAAUXPDv3FL34ROnXqlEZEbdu2DYceemho3rzwX8OPOeaYKs+rBQAAaOyUlwAAANTIzjvvHM4999ywzjrrpJkl2rdvH4499tiw9957pxmW1a1bt3DVVVdlz2lZq6++ehg0aFDo169fmgEAAGi6lJcAAADUSDzvMq4SvP3228PQoUOzFYUnnnhiuPnmm8PFF18cWrZsmT6T5R1yyCHhrrvuCieffPLS53b99ddnpabnBgAAoLwEAACglnbbbbdw5plnhquvvjpceOGF2YrLFi1apFcppEePHuG3v/3t0ue2zz77pFcAAABQXgIAAAAAAAAlodmsWbMWp3sAAKCR6NChQ7qr3Hd/D0h3DWvRokWhb9++4W9/+1uaKa9z585h7NixoVOnTmmm+v75z39m23C+8soraaa8733ve9nvvemmm6aZ6vviiy/C22+/nf3e8Zo+fXq2deq3334bNt9887DllluGrl27hh122CE0b16zfyMan8df//rXNCpvu+22C08++WRo06ZNmqm+d999N0ycODG88cYb2bV48ZK/+sWPrVq1yp71FltsEXbaaafs/1NTc+bMyb7/ylSVv6jQr2/Xrl1o3bp1GoXsc1566aXsmjx5cvjoo4+yZ7xw4cLQvXv30LNnz7D99tunz67al19+GS655JJw5ZVXppmKRo4cGfr3759Glfv666/D/Pnz06iiQs+g2HuvOs+tPsSVn+PHj0+jikaNGpU9awAAgIagvAQAgEZIeVlRbcrL2bNnZ6XONddcE95///3sKmTjjTcO3bp1C8cee2xWYla3cKzr8vKTTz7JzlB87LHHwltvvbW0tKxMLGA32WSTsMsuu2RlXe/evUPbtm3Tq4X9/e9/D7/4xS/CKquskhWhy4rP7MEHH8x+38rEryeelTl8+PCsqCz73mI2Pv/882wr2mHDhoU11lgjfPzxx+H0008PEyZMyArjyqy33nphv/32C2effXZo3759mi2sLsrLW2+9Ndx5551h3rx55YrW+L6K308sU+PZn2uttVZ6ZYn4PcSf9+qrr55mlohFbCzI//CHP4Qf//jHabbhKC8BAIBSYttYAACASrzwwgvhkEMOCQMHDsyKnWLFZTRt2rTwwAMPZOXUCSecED799NP0SsOIpeCf/vSn7NzJK664Irz55ptFi8sovv7ee++Fe+65Jysj4/cbi8Kqft0HH3yQ/brXX389vPzyy+WuuOIzlpuFxPIwPttYNk+ZMmXpr3v11VfDhx9+mP3/33nnnez3Puigg8JDDz1UsLiMysraww47LCsB61v8+s4666xsVWtcCbrs9x6fydSpU7NSd/niMorfY/ycZX9NvF577bXse4+vAQAANHXKSwAAoGTELUKrKs4Kqel2rcXEVYtx5d0zzzyTZqovriC89957w7777ltl4VlX4jO74YYbwtFHH52VgrURt0EdM2ZMOPDAA8ONN96YfR+FxNWFxZ738qsxlxX/P1999VUaVbTmmmtmxWBcwTpp0qQ0W7W4QvXnP/95vRaYcXXkKaecEubOnZtmKtpzzz3DpZdemkbltWjRIt1VFFfBVmfVKwAAQGOnvAQAAErGzJkza72lbV2dF/i///u/4eCDDy5asFVHPGcybscZz2isb3HFXtxqtS7EbV9PO+208Nvf/rZogVlf4orVWMQW2v63mKeffjrb0rU+xGdx8sknZytCC+nSpUu46aabarTNLwAAAOUpLwEAgJIRzxCM5y7269cvO8cwrl6szvWzn/0s7L777rUqvJYVtwGNxWVcAVpIXB0Xt2aNK/CqOp8wrryMJWB9i+dHfvbZZ2lUUVzNGM8sHDBgQPZs4zmRxcTv/4477siKuIYWt4iN28bW1p///OesBK9rV111VfZ7F7LBBhuE0aNHZ88aAACA2lNeAgAAJeXzzz8Pzz33XLaKLm7bWp1r3Lhx2ZmTKyJuZxrPiiy27eivf/3r8NRTT4URI0aEIUOGZNurxv93POeykEcffTQ767C+vPjii2Hs2LFpVNHGG2+cnRt53XXXhYsuuihcfvnl4b777guDBw8OnTp1Sp9V0SabbBI222yzNMpH+/btwy677BIGDRqUla7xa6rK888/X+utcwuJP8NYXhbKRseOHcO1114b1l577TQDAABAbSkvAQAAvhPPV3zggQfSqKILL7wwnHXWWWGbbbYJ6667blhjjTWy1XY77bRTVlzFsw4rE1eTxpWRtT3LsypxtenHH3+cRuXFVaK/+93vwvbbbx86d+4c1l9//ezadtttwwUXXBBGjhwZNtxww/TZS7Rs2TLsv//+WVm31157pdmGt9FGG4VbbrklPPjgg9nXcvfdd4f7778/HHfccekzKvfNN9+scJG97NmUn3zySTjvvPPCjBkz0kx5q622WvZ6z5490wwAAAArQnkJAAA0ebHwimclxo+V+elPfxp++ctfplFFcavQU089tVzptaxHHnlkhc/QLCSeEVqoGI3l5VprrZVGFcVVjXEVaSww27VrlxVwo0aNCrfddlvo2rVr+qyGF7/mO++8M/Tp0ydbfVlm8803z8rYbt26pZnKxcJxRay66qrpLoQTTzwxvPnmm2lUXix6zzjjjHDYYYelGQAAAFaU8hIAAGjy4hmLL7zwQhqV16ZNm3DUUUelUWFbb711+OEPf5hG5cUtaf/+97+nUd2KRV/8GivzxRdfhKFDh4Znn302zVQUC8xYCMatZB9++OGw6667plfyc9BBB4Uddtghjcpr1qxZOProo9Oocq+//nq6q7lWrVplZW4shOM2wmPGjEmvVHTEEUeEI488Mo0AAACoC8pLAACgyYtl19tvv51G5cUSa/XVVw/Tp08P3377bZotL67YjL9+/vz5aaaiuj6HsczOO++cbQVbyMsvvxx+/vOfh169eoUzzzwz2xp32ZWJ8Xvr379/6N69e5rJX6ESuEzcrrd588J/nS30c6qOuB3wzJkzw8SJE7Ptags55JBDwrnnnputbgUAAKDuKC8BAIAmb8qUKQW3Xo2rJk866aQwePDgcPDBB4eBAwdWeg0ZMiS89NJL6VdV9NZbb4UFCxakUd2JKz7j11VM/B5efPHFcPXVV2ffx7777hsOPfTQcM0114QJEyZkZV0pWXvttdNd5eK5o3HL1kLi6szaimXkc889F37/+98XPOcyiueCxvMuAQAAqFvKSwAAoKQccMAB4eyzzw6nn356+PWvf12t6/zzzw+HH354wTMnq/Lpp5+mu8pNmjQpPPHEE+Gxxx6r9Ipbi8YCtJi42nHevHlpVLfitrY//vGP06i4OXPmZGc4/vnPf87Oa4xFZiw0H3zwwYJnfjakuKKyqp9jx44ds+1d68MHH3wQLrzwwjB69Og0U7lp06YVLLwBAACoPeUlAABQMtq3bx9OO+208Ktf/Sr85je/CWeddVa1rrjqMRZOcUVebazISr3qat26db2VXbHMu+mmm0K3bt3STPV99dVXYdSoUVn5G1cTFjsfs6EsWrQo3VVu4cKFRbeNXVFxpWpV4jmh77//fhoBAABQV5SXAABAyYjnDXbo0CGNaubzzz9Pd6UpntMYy9n6Es+9fPjhh8Oxxx6bZmruL3/5S1Zg3nLLLWmGQj777LNsdXAsfwEAAKg7yksAAKBkxNV0tV0F+e2336a70hRL2TZt2qRR/YhnMF566aXhhRdeyLbe3WmnnWq8QjGuaozbySowqzZu3Lhw3333pREAAAB1QXkJAAA0ecVWRLZr1y784Q9/CCNGjAjDhg0Ll112WaVXfG348OHZffxY9rmxTLzkkkuybVkbylZbbZWdY3nnnXdmZ1ked9xxYc899wydO3dOn1Hc/PnzwzXXXFPlOZ5NXTzD9LrrrsvOvwQAAKBuKC8BAIAmb6ONNkp3FcUi8L/+67+y8vHoo48OxxxzTKVXfO3II48MRx11VPax7HPjNq6xPIwlaEOZO3duaNWqVbZVbc+ePbPy9O677w633npruPzyy8OAAQOyczKLefvtt8M999yTRk1TXAU8dOjQouX2q6++mj1fAAAA6obyEgAAaPL+4z/+I6y99tppVF4s8eL5htUxZ86c8Nprr4XFixenmRUTt8JdtGhRGlUtfu6NN94YTjjhhPD666+n2SXatm0bfvCDH2Tlaiwxx44dGwYNGlR0m94xY8aku6bpiCOOyM61jCtoV1111TRbUSyGJ06cmEYAAACsCOUlAADQ5G2xxRZh0003TaPy4irGBx54II0Ki4XltddeG/bYY49speby5WFtxDL0ww8/TKPCYskZt3mNq0R/9atfhYceeiicc845Rc8B7dKlS7YV7vbbb59mKqrvMzpLWfw5/v73v8/ODI0/z/333z+9UlH82cfnXlelNQAAQFOmvAQAAJq89ddfP2y77bZpVNFpp50WJk+enEaVe+ONN8Idd9yR3Y8ePTr07ds3HH/88eGDDz7I5goptiXpjBkzwrvvvptGFS1YsCD86U9/Crvvvns444wzyq0Qfe6558L//M//pFHlYjHXqVOnNKqoJqs+G5Ndd901K4NbtmyZjePHuJp14403zsaVeemll8LIkSPTCAAAgNpSXgIAAHxn4MCBoUWLFmlUXlxRF8+ufOqpp9JMeXHL0FhwLltUzpo1KyuzYolZ7OzIYudtfvnll+Hhhx8OX3/9dZop77777svOsIxb1S4vFptx9eV1112XlaCVeeutt8Irr7ySRhV17tw53TUtBx54YIXvPW4tfO655xbdZjeefVkXK24BAACaMuUlAADAd+J5kIMHD06jiiZNmhSOOeaY7Lr55pvDo48+mhWLsbQ88sgjwzPPPJM+s7xYaMYzJgttKbrBBhuku8rdf//92dcVf4/rr78+28r0sccey16LqyaLbQ0bC9Szzz47HHzwwdnXHFeEPv3009l1xRVXZPPTp09Pn11e69atQ69evdKoaSm0wrJ///5h7733TqOK4s86lsXz589PMwAAANSU8hIAAOA7cQvVU089Neywww5ppqJ//etf4Y9//GM45ZRTsuJv0KBBWaE4bdq09BkVxXMj4+9baMVeXHm52mqrpVFFX331Vbj77rvDSSedlBWlF110UXjxxRez13r37h0OO+ywomdTfvPNN2HChAnZ1/yf//mfYb/99suuuIpw6tSp6bMq2mmnnbLPb4riM69MfM5DhgxJo8rdddddYdy4cWkEAABATSkvAQAAklgixhWOxc6BrIlYiA4bNizstddeaaaiH/3oR2HddddNo6rFFZxrrLFGGoVsJWgsNlu1apVmVlw8h/Piiy8O7dq1SzOU2W233cKZZ56ZRhXFc0JPP/308NFHH6UZAAAAakJ5CQAAsIzNNtss26q1Z8+eaaZ24iq9uAovrs4sZsMNNwxnnHFG0bMUlxV/32XPyYylZSzL7r333tClS5c0W3trrrlmuPHGG0O3bt3SDMsbOnRo2HHHHdOoorgS95prrim4VTAAAACFKS8BAIAGE89n/Oyzz9KoopkzZ4aF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AICSo7wEAIAmbujQoeGGG25Io5rr2rVr6N+/f1h33XUrXMCK+/zzz7N/ZBALy3g9/vjjK3QW7Z577hkefPDBNAIAACgtyksAACDccccd4cQTTwyLF/vrQalYf/31sytu0Vt2X3bFla+lZPz48VnBNnPmzOxj2VU2pnYWLFiQlZZ1+QwHDx4cLrjggjQCAAAoPcpLAAAg8+STT4ZTTjklTJs2Lc1QquL5o/369Qu9e/fOisx11lknvdIwYllZdj3//PNh4cKF6RVKVdwm9vzzzw8DBw5MMwAAAKVJeQkAACw1efLkMGLEiPDHP/4xzbAy6NWrV1Zi9uzZM+y4445ptm7ddtttYezYseGvf/1rmDFjRpplZXDQQQdlK6u33XbbNAMAAFC6lJcAAEAFo0ePDtdcc0145pln0gwri4MPPjgMGjQo7LrrrmlmxcQi++abbw4vvPBCmmFl0aNHj3DCCSeEPn36pBkAAIDSp7wEAAAKiqvtrr322jB16tQ0w8rigAMOCIceemi2GrM2HnrooXDTTTeFv/zlL2mGlcVWW20Vjj/++HD44YenGQAAgJWH8hIAAChq9uzZWYH57LPPhueeey7NsrLo379/VmLuvffeaaa4xx9/PFtpOWbMmDTDyuJHP/pRttoyFpfxXFQAAICVkfISAACotk8++SSMGzcuu2KZOX369PQKpW7IkCHhvPPOC82aNUszFV122WXhoosuSiNWBrGUjtcee+wRunTpkmYBAABWXspLAACg1l577bXw9ttvh48++mjp9fHHHy+9p7TEczCvvvrqsMUWW6SZJeLPaujQoeHRRx9NM5SCli1bhjXXXLPSa/vttw+9e/cO7du3T58NAADQOCgvAQAAStCMGTMqvR577LEwadKk9Fk117x583DFFVeEww47LBuPHj06DBw4MCxatCgb11b37t1D586dw8Ybb5x9XPYCAACA6lJeAgAArGTefffd7EzKJ554Ijz55JNptmZiYdm2bdtw6623ppma2XbbbbOVnD179gy9evUK7dq1S68AAABA7SkvAQAAVmKxyLz77rvDTTfdFGbOnJlm60fcrvSoo44KBxxwQNhqq63SLAAAANQd5SUAAEAj8M9//jMrMOM1f/78NFs34qrKWFrGa5NNNkmzAAAAUPeUlwAAAI3IlClTlpaYdaGstNx6663TDAAAANQf5SUAAEAj9Nhjj4UTTzwxzJgxI83UzIYbbhhGjBiRnWcJAAAADUV5CQAA0Ei9+uqr4YgjjghvvfVWmqme3XbbLdx4441ho402SjMAAADQMJSXAAAAjVyfPn3ChAkT0qi4Aw88sM62nAUAAICaap4+AgAA0EiNHj06HHfccWlU2Mknn6y4BAAAIFfKSwAAgCbgkksuCRdeeGEaVTRkyJBw7rnnphEAAADkw7axAAAATcgtt9ySrbBc1pFHHhmGDx+eRgAAAJAfKy8BAACakFhUXnzxxWkUsu1kFZcAAACUCisvAQAAmqBhw4aFefPmhXPOOSfNAAAAQN5C+D/kUjcdVDZlYwAAAABJRU5ErkJggg=="></div></td></tr></table></td></tr></table></td></tr></table><!--FI--></body></html>'
    )
  })
})
