FROM registry.access.redhat.com/ubi8/nodejs-14 as base

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
COPY ./packages/configuration-backend ./packages/configuration-backend
COPY ./packages/payment-experience-api ./packages/payment-experience-api

# Chown to correct user
USER 0
RUN chown -R 1001:0 ${APP_ROOT} && chmod -R ug+rwx ${APP_ROOT} && \
    rpm-file-permissions
USER 1001


# Run install for all required packages
RUN yarn workspace @verkkokauppa/core install
RUN yarn workspace @verkkokauppa/order-backend install
RUN yarn workspace @verkkokauppa/payment-backend install
RUN yarn workspace @verkkokauppa/configuration-backend install
RUN yarn workspace @verkkokauppa/payment-experience-api install

# Create production build
FROM base as production
RUN yarn workspace @verkkokauppa/core build
RUN yarn workspace @verkkokauppa/order-backend build
RUN yarn workspace @verkkokauppa/payment-backend build
RUN yarn workspace @verkkokauppa/configuration-backend build
RUN yarn workspace @verkkokauppa/payment-experience-api build
EXPOSE 8080
CMD yarn workspace @verkkokauppa/payment-experience-api start -d