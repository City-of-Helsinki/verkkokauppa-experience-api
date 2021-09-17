FROM registry.access.redhat.com/ubi8/nodejs-14:1-35.1626836507 as base
ARG TZ

# Install yarn
RUN npm install -g yarn

# Copy monorepo general contents
COPY ./package*.json .
COPY ./yarn.lock .
COPY ./tsconfig.json ./tsconfig.json
COPY ./tsconfig.base.json ./tsconfig.base.json
COPY ./jest.config.js ./jest.config.js

# Copy package and dependent packages
COPY ./packages/core ./packages/core
COPY ./packages/order-backend ./packages/order-backend
COPY ./packages/payment-backend ./packages/payment-backend
COPY ./packages/message-backend ./packages/message-backend
COPY ./packages/product-backend ./packages/product-backend
COPY ./packages/configuration-backend ./packages/configuration-backend
COPY ./packages/payment-experience-api ./packages/payment-experience-api

# Chown to correct user
USER 0
RUN chown -R 1001:0 ${APP_ROOT} && chmod -R ug+rwx ${APP_ROOT} && \
    rpm-file-permissions
USER 1001


# Run install for all required packages
RUN yarn workspace @verkkokauppa/core install && \
yarn workspace @verkkokauppa/order-backend install && \
yarn workspace @verkkokauppa/payment-backend install && \
yarn workspace @verkkokauppa/message-backend install  && \
yarn workspace @verkkokauppa/product-backend install && \
yarn workspace @verkkokauppa/configuration-backend install && \
yarn workspace @verkkokauppa/payment-experience-api install
RUN NODE_ICU_DATA=node_modules/full-icu TZ=$TZ yarn test

# Create production build
FROM base as production
RUN yarn workspace @verkkokauppa/core build && \
yarn workspace @verkkokauppa/order-backend build && \
yarn workspace @verkkokauppa/payment-backend build && \
yarn workspace @verkkokauppa/message-backend build && \
yarn workspace @verkkokauppa/product-backend build && \
yarn workspace @verkkokauppa/configuration-backend build && \
yarn workspace @verkkokauppa/payment-experience-api build
EXPOSE 8080
CMD yarn workspace @verkkokauppa/payment-experience-api start -d