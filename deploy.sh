#!/bin/bash
# OmniOracle - One-Click Deploy Script
# Usage: ./deploy.sh

set -e

echo "╔══════════════════════════════════════════════╗"
echo "║        OmniOracle Deployment Script          ║"
echo "║     Base Sepolia (Chain ID: 84532)           ║"
echo "╚══════════════════════════════════════════════╝"

# Load .env
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
else
  echo "ERROR: .env file not found. Copy .env.example to .env and fill in your PRIVATE_KEY."
  exit 1
fi

# Check balance
DEPLOYER=$(cast wallet address $PRIVATE_KEY 2>/dev/null)
BALANCE=$(cast balance $DEPLOYER --rpc-url $BASE_SEPOLIA_RPC_URL 2>/dev/null)
echo ""
echo "Deployer: $DEPLOYER"
echo "Balance:  $(cast from-wei $BALANCE) ETH"

if [ "$BALANCE" = "0" ]; then
  echo ""
  echo "ERROR: No ETH balance. Get Base Sepolia ETH from:"
  echo "  - https://www.alchemy.com/faucets/base-sepolia"
  echo "  - https://faucet.quicknode.com/base/sepolia"
  echo "  - https://portal.cdp.coinbase.com/products/faucet"
  exit 1
fi

echo ""
echo "Step 1/3: Deploying smart contracts..."
cd contracts
DEPLOY_OUTPUT=$(forge script script/Deploy.s.sol:Deploy \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --broadcast \
  --verify \
  -vvv 2>&1)

echo "$DEPLOY_OUTPUT"

# Extract addresses from deployment output
ORACLE_PIPELINE=$(echo "$DEPLOY_OUTPUT" | grep "OraclePipeline:" | awk '{print $2}')
MARKET_FACTORY=$(echo "$DEPLOY_OUTPUT" | grep "MarketFactory:" | awk '{print $2}')
OMNI_RESOLVER=$(echo "$DEPLOY_OUTPUT" | grep "OmniResolver:" | awk '{print $2}')
CROSS_CHAIN_REGISTRY=$(echo "$DEPLOY_OUTPUT" | grep "CrossChainRegistry:" | awk '{print $2}')
AUTO_RESOLVER=$(echo "$DEPLOY_OUTPUT" | grep "AutoResolver:" | awk '{print $2}')

cd ..

echo ""
echo "Step 2/3: Updating .env with deployed addresses..."

# Update root .env
sed -i '' "s|MARKET_FACTORY_ADDRESS=.*|MARKET_FACTORY_ADDRESS=$MARKET_FACTORY|" .env
sed -i '' "s|ORACLE_PIPELINE_ADDRESS=.*|ORACLE_PIPELINE_ADDRESS=$ORACLE_PIPELINE|" .env
sed -i '' "s|OMNI_RESOLVER_ADDRESS=.*|OMNI_RESOLVER_ADDRESS=$OMNI_RESOLVER|" .env
sed -i '' "s|CROSS_CHAIN_REGISTRY_ADDRESS=.*|CROSS_CHAIN_REGISTRY_ADDRESS=$CROSS_CHAIN_REGISTRY|" .env
sed -i '' "s|AUTO_RESOLVER_ADDRESS=.*|AUTO_RESOLVER_ADDRESS=$AUTO_RESOLVER|" .env

# Update frontend .env.local
cat > frontend/.env.local << EOF
NEXT_PUBLIC_MARKET_FACTORY_ADDRESS=$MARKET_FACTORY
NEXT_PUBLIC_ORACLE_PIPELINE_ADDRESS=$ORACLE_PIPELINE
NEXT_PUBLIC_OMNI_RESOLVER_ADDRESS=$OMNI_RESOLVER
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=placeholder
EOF

echo ""
echo "Step 3/3: Rebuilding frontend with new addresses..."
cd frontend && npm run build
cd ..

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║          Deployment Complete!                ║"
echo "╠══════════════════════════════════════════════╣"
echo "║  OraclePipeline:      $ORACLE_PIPELINE"
echo "║  MarketFactory:       $MARKET_FACTORY"
echo "║  OmniResolver:        $OMNI_RESOLVER"
echo "║  CrossChainRegistry:  $CROSS_CHAIN_REGISTRY"
echo "║  AutoResolver:        $AUTO_RESOLVER"
echo "╠══════════════════════════════════════════════╣"
echo "║  Base Sepolia Explorer:                      ║"
echo "║  https://sepolia.basescan.org/address/$MARKET_FACTORY"
echo "╚══════════════════════════════════════════════╝"
