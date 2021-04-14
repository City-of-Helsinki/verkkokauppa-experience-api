FROM registry.access.redhat.com/ubi8/nodejs-14 as base

# Install yarn
RUN npm install -g yarn

# Copy monorepo general contents
COPY ./package*.json .
COPY ./tsconfig.json ./tsconfig.json
COPY ./tsconfig.base.json ./tsconfig.base.json

# Copy package and dependent packages
COPY ./packages/types ./packages/types
COPY ./packages/price-experience-api ./packages/price-experience-api
COPY ./packages/price-backend ./packages/price-backend

# Chown to correct user
USER 0
RUN chown -R 1001:0 ./
USER 1001

# Run install for all required packages
RUN yarn workspace @verkkokauppa/price-backend install
RUN yarn workspace @verkkokauppa/price-experience-api install

# Create production build
FROM base as production
RUN yarn build
EXPOSE 8080
CMD yarn -d start