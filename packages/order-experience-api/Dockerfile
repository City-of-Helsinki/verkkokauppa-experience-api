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
COPY ./packages/core ./packages/core
COPY ./packages/cart-backend ./packages/cart-backend
COPY ./packages/order-backend ./packages/order-backend
COPY ./packages/payment-backend ./packages/payment-backend
COPY ./packages/message-backend ./packages/message-backend
COPY ./packages/price-backend ./packages/price-backend
COPY ./packages/product-backend ./packages/product-backend
COPY ./packages/configuration-backend ./packages/configuration-backend
COPY ./packages/order-experience-api ./packages/order-experience-api
COPY ./packages/auth-helsinki-profile ./packages/auth-helsinki-profile
COPY ./packages/product-mapping-backend ./packages/product-mapping-backend

# Chown to correct user
USER 0
RUN mkdir -p /opt/app-root/src/.config/yarn && chown -R 1001:0 /opt/app-root/src/.config/yarn && chown -R 1001:0 ${APP_ROOT} && chmod -R ug+rwx ${APP_ROOT} && \
    rpm-file-permissions
USER 1001


# Run install for all required packages
RUN yarn workspace @verkkokauppa/core install
RUN yarn workspace @verkkokauppa/auth-helsinki-profile install
RUN yarn workspace @verkkokauppa/cart-backend install
RUN yarn workspace @verkkokauppa/order-backend install
RUN yarn workspace @verkkokauppa/message-backend install
RUN yarn workspace @verkkokauppa/price-backend install
RUN yarn workspace @verkkokauppa/product-backend install
RUN yarn workspace @verkkokauppa/product-mapping-backend install
RUN yarn workspace @verkkokauppa/payment-backend install
RUN yarn workspace @verkkokauppa/configuration-backend install
RUN yarn workspace @verkkokauppa/order-experience-api install

# Create production build
FROM base as production
RUN yarn workspace @verkkokauppa/core build
RUN yarn workspace @verkkokauppa/auth-helsinki-profile build
RUN yarn workspace @verkkokauppa/cart-backend build
RUN yarn workspace @verkkokauppa/order-backend build
RUN yarn workspace @verkkokauppa/price-backend build
RUN yarn workspace @verkkokauppa/product-backend build
RUN yarn workspace @verkkokauppa/product-mapping-backend build
RUN yarn workspace @verkkokauppa/payment-backend build
RUN yarn workspace @verkkokauppa/message-backend build
RUN yarn workspace @verkkokauppa/configuration-backend build
RUN yarn workspace @verkkokauppa/order-experience-api build
EXPOSE 8080
CMD yarn workspace @verkkokauppa/order-experience-api start -d