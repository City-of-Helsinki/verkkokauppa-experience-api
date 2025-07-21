To set express to run as https: we need to create certificates for it.

instead of steps 1 and 2 you might get the mkcert.exe version 1.4.4 from here: https://community.chocolatey.org/packages/mkcert

1. install chokolatey software management tool: https://chocolatey.org/
2. install mkcert 1.4.4 using chokolatey. Instructions here: https://community.chocolatey.org/packages/mkcert
3. Make sure you have the 1.4.4 version: `mkcert --version`
4. setup local certificate authority `mkcert -install`
5. create certificates `mkcert --cert-file cert.crt --key-file cert.key  localhost 127.0.0.1 example.test "*.example.test"`
6. copy .crt and .key files to verkkokauppa-kassa-ui/config/ directory

[//]: # (Outdated instructions in case new ones do not work)
[//]: # (1. `npm install -g mkcert`)
[//]: # (2. `mkcert create-ca`)
[//]: # (3. `mkcert create-cert --domains localhost,127.0.0.1,example.test,*.example.test`)
[//]: # (4. add `127.0.0.1 example.test` to C:\Windows\System32\drivers\etc file guide https://ecompile.io/blog/localhost-custom-domain-name)
[//]: # (5. Paytrail forces to have non localhost https server where they send redirect/callback urls)
[//]: # (6. Payment experience api should now allow calls to `https://example.test:8285/v1/payment/paytrailOnlinePayment/return/success` etc)
[//]: # (7. Uncomment `USE_HTTPS_SERVER='true'` in `.env.docker` to use https server)