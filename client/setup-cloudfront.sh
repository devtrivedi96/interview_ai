#!/bin/bash

# CloudFront Setup Script for Interview AI Client
# This script creates a CloudFront distribution with Origin Access Identity

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
S3_BUCKET="${AWS_S3_BUCKET:-interview-ai-client}"
AWS_REGION="${AWS_REGION:-us-east-1}"

echo -e "${GREEN}Setting up CloudFront distribution...${NC}"

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    exit 1
fi

# Step 1: Create Origin Access Identity (OAI)
echo -e "${YELLOW}Creating Origin Access Identity...${NC}"
OAI_OUTPUT=$(aws cloudfront create-cloud-front-origin-access-identity \
    --cloud-front-origin-access-identity-config \
    CallerReference="interview-ai-$(date +%s)",Comment="Interview AI Client OAI" \
    --output json)

OAI_ID=$(echo $OAI_OUTPUT | jq -r '.CloudFrontOriginAccessIdentity.Id')
OAI_CANONICAL_USER=$(echo $OAI_OUTPUT | jq -r '.CloudFrontOriginAccessIdentity.S3CanonicalUserId')

echo -e "${GREEN}OAI Created: ${OAI_ID}${NC}"

# Step 2: Update S3 bucket policy to allow CloudFront OAI
echo -e "${YELLOW}Updating S3 bucket policy...${NC}"

cat > /tmp/cloudfront-bucket-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontOAI",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity ${OAI_ID}"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::${S3_BUCKET}/*"
    }
  ]
}
EOF

# Remove Block Public Access if needed (only for this specific use case)
echo -e "${YELLOW}Configuring bucket access...${NC}"
aws s3api put-public-access-block \
    --bucket "${S3_BUCKET}" \
    --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=false,RestrictPublicBuckets=false"

aws s3api put-bucket-policy \
    --bucket "${S3_BUCKET}" \
    --policy file:///tmp/cloudfront-bucket-policy.json

echo -e "${GREEN}Bucket policy updated${NC}"

# Step 3: Create CloudFront distribution
echo -e "${YELLOW}Creating CloudFront distribution...${NC}"

cat > /tmp/cloudfront-config.json <<EOF
{
  "CallerReference": "interview-ai-$(date +%s)",
  "Comment": "Interview AI Client Distribution",
  "Enabled": true,
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-${S3_BUCKET}",
        "DomainName": "${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": "origin-access-identity/cloudfront/${OAI_ID}"
        }
      }
    ]
  },
  "DefaultRootObject": "index.html",
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-${S3_BUCKET}",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"],
      "CachedMethods": {
        "Quantity": 2,
        "Items": ["GET", "HEAD"]
      }
    },
    "Compress": true,
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {
        "Forward": "none"
      }
    },
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000,
    "TrustedSigners": {
      "Enabled": false,
      "Quantity": 0
    }
  },
  "CustomErrorResponses": {
    "Quantity": 2,
    "Items": [
      {
        "ErrorCode": 403,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 300
      },
      {
        "ErrorCode": 404,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 300
      }
    ]
  },
  "PriceClass": "PriceClass_100"
}
EOF

DISTRIBUTION_OUTPUT=$(aws cloudfront create-distribution \
    --distribution-config file:///tmp/cloudfront-config.json \
    --output json)

DISTRIBUTION_ID=$(echo $DISTRIBUTION_OUTPUT | jq -r '.Distribution.Id')
DISTRIBUTION_DOMAIN=$(echo $DISTRIBUTION_OUTPUT | jq -r '.Distribution.DomainName')

echo -e "${GREEN}CloudFront distribution created!${NC}"
echo -e "${GREEN}Distribution ID: ${DISTRIBUTION_ID}${NC}"
echo -e "${GREEN}Domain: ${DISTRIBUTION_DOMAIN}${NC}"
echo ""
echo -e "${YELLOW}Save these values:${NC}"
echo -e "export AWS_CLOUDFRONT_DISTRIBUTION_ID=${DISTRIBUTION_ID}"
echo -e "export CLOUDFRONT_DOMAIN=${DISTRIBUTION_DOMAIN}"
echo ""
echo -e "${YELLOW}Your site will be available at:${NC}"
echo -e "${GREEN}https://${DISTRIBUTION_DOMAIN}${NC}"
echo ""
echo -e "${YELLOW}Note: CloudFront deployment takes 15-20 minutes to complete.${NC}"
echo -e "${YELLOW}Check status: aws cloudfront get-distribution --id ${DISTRIBUTION_ID}${NC}"

# Cleanup temp files
rm -f /tmp/cloudfront-bucket-policy.json /tmp/cloudfront-config.json

echo -e "${GREEN}Setup complete!${NC}"
