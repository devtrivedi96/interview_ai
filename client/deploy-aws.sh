#!/bin/bash

# AWS Deployment Script for Interview AI Client
# This script builds and deploys the React app to AWS S3 + CloudFront

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
S3_BUCKET="${AWS_S3_BUCKET:-interview-ai-client}"
CLOUDFRONT_DISTRIBUTION_ID="${AWS_CLOUDFRONT_DISTRIBUTION_ID}"
AWS_REGION="${AWS_REGION:-us-east-1}"
BUILD_DIR="dist"

echo -e "${GREEN}Starting deployment to AWS...${NC}"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    echo "Install it with: pip install awscli"
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}Error: AWS credentials not configured${NC}"
    echo "Run: aws configure"
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found${NC}"
    echo "Create .env file with your configuration"
    exit 1
fi

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install

# Build the application
echo -e "${YELLOW}Building application...${NC}"
npm run build

# Check if build was successful
if [ ! -d "$BUILD_DIR" ]; then
    echo -e "${RED}Error: Build directory not found${NC}"
    exit 1
fi

# Create S3 bucket if it doesn't exist
echo -e "${YELLOW}Checking S3 bucket...${NC}"
if ! aws s3 ls "s3://${S3_BUCKET}" 2>&1 > /dev/null; then
    echo -e "${YELLOW}Creating S3 bucket: ${S3_BUCKET}${NC}"
    aws s3 mb "s3://${S3_BUCKET}" --region "${AWS_REGION}"
    echo -e "${GREEN}S3 bucket created${NC}"
else
    echo -e "${GREEN}S3 bucket exists${NC}"
fi

# Note: We'll use CloudFront with OAI instead of public bucket policy
echo -e "${YELLOW}Note: Bucket is private. Use CloudFront for public access.${NC}"

# Sync files to S3
echo -e "${YELLOW}Uploading files to S3...${NC}"
aws s3 sync "${BUILD_DIR}/" "s3://${S3_BUCKET}/" \
    --delete \
    --cache-control "public, max-age=31536000" \
    --exclude "index.html" \
    --exclude "*.map"

# Upload index.html with no-cache
aws s3 cp "${BUILD_DIR}/index.html" "s3://${S3_BUCKET}/index.html" \
    --cache-control "no-cache, no-store, must-revalidate" \
    --content-type "text/html"

echo -e "${GREEN}Files uploaded to S3${NC}"

# Invalidate CloudFront cache if distribution ID is provided
if [ -n "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
    echo -e "${YELLOW}Invalidating CloudFront cache...${NC}"
    aws cloudfront create-invalidation \
        --distribution-id "${CLOUDFRONT_DISTRIBUTION_ID}" \
        --paths "/*"
    echo -e "${GREEN}CloudFront cache invalidated${NC}"
else
    echo -e "${YELLOW}CloudFront distribution ID not set, skipping cache invalidation${NC}"
fi

# Get S3 website URL
S3_WEBSITE_URL="http://${S3_BUCKET}.s3-website-${AWS_REGION}.amazonaws.com"

echo -e "${GREEN}Deployment complete!${NC}"
echo -e "${GREEN}S3 Website URL: ${S3_WEBSITE_URL}${NC}"

if [ -n "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
    echo -e "${GREEN}CloudFront URL: Check your CloudFront distribution${NC}"
fi

echo -e "${YELLOW}Note: Make sure to update CORS settings on your backend to allow the new domain${NC}"
