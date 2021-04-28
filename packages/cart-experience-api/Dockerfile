FROM registry.access.redhat.com/ubi8/nodejs-14 as base

# Install yarn
RUN npm install -g yarn

# Copy monorepo general contents
COPY ./package*.json .
COPY ./tsconfig.json ./tsconfig.json
COPY ./tsconfig.base.json ./tsconfig.base.json

# Copy package and dependent packages
COPY ./packages/types ./packages/types
COPY ./packages/core ./packages/core
COPY ./packages/cart-backend ./packages/cart-backend
COPY ./packages/cart-experience-api ./packages/cart-experience-api

# Chown to correct user
USER 0
RUN chown -R 1001:0 ${APP_ROOT} && chmod -R ug+rwx ${APP_ROOT} && \
    rpm-file-permissions
USER 1001


# Run install for all required packages
RUN yarn workspace @verkkokauppa/core install
RUN yarn workspace @verkkokauppa/cart-backend install
RUN yarn workspace @verkkokauppa/cart-experience-api install

# Create production build
FROM base as production
RUN yarn workspace @verkkokauppa/core build
RUN yarn workspace @verkkokauppa/cart-backend build
RUN yarn workspace @verkkokauppa/cart-experience-api build
EXPOSE 8080
CMD yarn workspace @verkkokauppa/cart-experience-api start -d