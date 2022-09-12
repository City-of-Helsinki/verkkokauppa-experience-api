## Local development

Build packages locally when using core in docker:
1. `yarn install`
2. `yarn build`
3. `docker compose up`

Build packages locally when using intellij spring boot applications:
1. `yarn install`
2. `yarn build`
3. `docker compose -f docker-compose.dev.yml up`

Before git push
1. `yarn build` To build before pushing, pushing has a hook that runs `yarn test`
2. `git push`

## Swagger endpoints
### Working swagger endpoints
* [Merchant exp-api swagger](http://localhost:8086/v1/merchant/docs/swagger-ui/)
* [Order-experience-api swagger](http://localhost:8084/v1/order/docs/swagger-ui/)
* [Product-experience-api swagger](http://localhost:8081/v1/product/docs/swagger-ui/)
* [Price-experience-api swagger](http://localhost:8082/v1/price/docs/swagger-ui/)
* [Payment-experience-api swagger](http://localhost:8085/v1/payment/docs/swagger-ui/)

### Not yet implemented.
* [Cart-experience-api swagger](http://localhost:8083/v1/cart/docs/swagger-ui/)
