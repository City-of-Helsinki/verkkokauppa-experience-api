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
COPY ./packages/product-backend ./packages/product-backend
COPY ./packages/product-mapping-backend ./packages/product-mapping-backend
COPY ./packages/price-backend ./packages/price-backend
COPY ./packages/product-experience-api ./packages/product-experience-api
COPY ./packages/configuration-backend ./packages/configuration-backend

# Chown to correct user
USER 0
RUN mkdir -p /opt/app-root/src/.config/yarn && chown -R 1001:0 /opt/app-root/src/.config/yarn && chown -R 1001:0 ${APP_ROOT} && chmod -R ug+rwx ${APP_ROOT} && \
    rpm-file-permissions
USER 1001

# Run install for all required packages
RUN yarn workspace @verkkokauppa/core install
RUN yarn workspace @verkkokauppa/product-backend install
RUN yarn workspace @verkkokauppa/product-mapping-backend install
RUN yarn workspace @verkkokauppa/price-backend install
RUN yarn workspace @verkkokauppa/product-experience-api install
RUN yarn workspace @verkkokauppa/configuration-backend install

# Create production build
FROM base as production
RUN yarn workspace @verkkokauppa/core build
RUN yarn workspace @verkkokauppa/product-backend build
RUN yarn workspace @verkkokauppa/product-mapping-backend build
RUN yarn workspace @verkkokauppa/price-backend build
RUN yarn workspace @verkkokauppa/configuration-backend build

RUN yarn workspace @verkkokauppa/product-experience-api build
EXPOSE 8080
CMD yarn workspace @verkkokauppa/product-experience-api start -d