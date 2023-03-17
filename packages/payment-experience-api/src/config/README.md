To set express to run as https: we need to create certificates for it.

1. `npm install -g mkcert`
2. `mkcert create-ca`
3. `mkcert create-cert --domains localhost,127.0.0.1,example.test,*.example.test`
4. add `127.0.0.1 example.test` to C:\Windows\System32\drivers\etc file guide https://ecompile.io/blog/localhost-custom-domain-name
5. Paytrail forces to have non localhost https server where they send redirect/callback urls
6. Payment experience api should now allow calls to `https://example.test:8285/v1/payment/paytrailOnlinePayment/return/success` etc
7. Uncomment `USE_HTTPS_SERVER='true'` in `.env.docker` to use https server