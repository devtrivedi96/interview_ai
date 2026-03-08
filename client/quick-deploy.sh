#!/bin/bash

# Quick Deploy Script - Simplified deployment without public bucket policy
# Uses CloudFront with Origin Access Identity for secure access

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
S3_BUCKET="${AWS_S3_BUCKET:-interview-ai-client}"
CLOUDFRONT_DISTRIBUTION_ID="${AWS_CLOUDFRONT_DISTRIBUTION_ID}"
AWS_REGION="${AWS_REGION:-us-east-1}"
BUILD_DIR="dist"

echo -e "${GREEN}Quick Deploy to AWS S3 + CloudFront${NC}"

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    exit 1
fi

# Check credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}Error: AWS credentials not configured${NC}"
    exit 1
fi

# Check if CloudFront distribution ID is set
if [ -z "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
    echo -e "${YELLOW}Warning: CLOUDFRONT_DISTRIBUTION_ID not set${NC}"
    echo -e "${YELLOW}Run ./setup-cloudfront.sh first to create CloudFront distribution${NC}"
    echo ""
    read -p "Continue with S3 upload only? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install

# Build
echo -e "${YELLOW}Building application...${NC}"
npm run build

# Check build
if [ ! -d "$BUILD_DIR" ]; then
    echo -e "${RED}Error: Build directory not found${NC}"
    exit 1
fi

# Upload to S3
echo -e "${YELLOW}Uploading to S3...${NC}"
aws s3 sync "${BUILD_DIR}/" "s3://${S3_BUCKET}/" \
    --delete \
    --cache-control "public, max-age=31536000, immutable" \
    --exclude "index.html" \
    --exclude "*.map"

# Upload index.html separately with no-cache
aws s3 cp "${BUILD_DIR}/index.html" "s3://${S3_BUCKET}/index.html" \
    --cache-control "no-cache, no-store, must-revalidate" \
    --content-type "text/html"

echo -e "${GREEN}Files uploaded to S3${NC}"

# Invalidate CloudFront cache
if [ -n "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
    echo -e "${YELLOW}Invalidating CloudFront cache...${NC}"
    INVALIDATION_ID=$(aws cloudfront create-invalidation \
        --distribution-id "${CLOUDFRONT_DISTRIBUTION_ID}" \
        --paths "/*" \
        --query 'Invalidation.Id' \
        --output text)
    
    echo -e "${GREEN}CloudFront cache invalidated (ID: ${INVALIDATION_ID})${NC}"
    
    # Get CloudFront domain
    CLOUDFRONT_DOMAIN=$(aws cloudfront get-distribution \
        --id "${CLOUDFRONT_DISTRIBUTION_ID}" \
        --query 'Distribution.DomainName' \
        --output text)
    
    echo -e "${GREEN}Your site: https://${CLOUDFRONT_DOMAIN}${NC}"
else
    echo -e "${YELLOW}Skipping CloudFront invalidation (no distribution ID)${NC}"
fi

echo -e "${GREEN}Deployment complete!${NC}"
