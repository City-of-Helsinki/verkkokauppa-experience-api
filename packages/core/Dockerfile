FROM registry.access.redhat.com/ubi8/nodejs-18 as base

# Install yarn
RUN npm install -g yarn

# Copy monorepo general contents
COPY ./package*.json .
COPY ./yarn.lock .
COPY ./tsconfig.json ./tsconfig.json
COPY ./tsconfig.base.json ./tsconfig.base.json
COPY ./jest.config.js ./jest.config.js

# Copy package and dependent packages
COPY ./packages/auth-helsinki-profile ./packages/auth-helsinki-profile
COPY ./packages/cart-backend ./packages/cart-backend
COPY ./packages/configuration-backend ./packages/configuration-backend
COPY ./packages/core ./packages/core
COPY ./packages/message-backend ./packages/message-backend
COPY ./packages/order-backend ./packages/order-backend
COPY ./packages/payment-backend ./packages/payment-backend
COPY ./packages/price-backend ./packages/price-backend
COPY ./packages/product-backend ./packages/product-backend
COPY ./packages/product-mapping-backend ./packages/product-mapping-backend

COPY ./packages/payment-experience-api ./packages/payment-experience-api

# Chown to correct user
USER 0
RUN chown -R 1001:0 ${APP_ROOT} && chmod -R ug+rwx ${APP_ROOT} && \
    rpm-file-permissions
USER 1001

# Run install for all required packages
RUN yarn workspace @verkkokauppa/auth-helsinki-profile install && \
yarn workspace @verkkokauppa/core install && \
yarn workspace @verkkokauppa/cart-backend install && \
yarn workspace @verkkokauppa/configuration-backend install && \
yarn workspace @verkkokauppa/message-backend install && \
yarn workspace @verkkokauppa/order-backend install && \
yarn workspace @verkkokauppa/payment-backend install && \
yarn workspace @verkkokauppa/price-backend install && \
yarn workspace @verkkokauppa/product-backend install && \
yarn workspace @verkkokauppa/product-mapping-backend install && \
yarn workspace @verkkokauppa/payment-experience-api install

EXPOSE 8080
CMD yarn workspace @verkkokauppa/core dev:all -d