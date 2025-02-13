#!/bin/bash
set -e

# Define an array of strings
BACKEND_API_DEPENDENCY=(
"/opt/app-root/src/packages/auth-helsinki-profile"
"/opt/app-root/src/packages/core"
"/opt/app-root/src/packages/cart-backend"
"/opt/app-root/src/packages/configuration-backend"
"/opt/app-root/src/packages/message-backend"
"/opt/app-root/src/packages/order-backend"
"/opt/app-root/src/packages/payment-backend"
"/opt/app-root/src/packages/price-backend"
"/opt/app-root/src/packages/product-backend"
"/opt/app-root/src/packages/product-mapping-backend"
)

# Use a for loop to iterate over the array
for backendPath in "${BACKEND_API_DEPENDENCY[@]}"; do
    echo "backendPath: $backendPath"
    # Use a for loop to iterate over the array
    bash -c "cd $backendPath && yarn run dev" &
done

# To keep a Docker container running indefinitely after executing the command
tail -f /dev/null