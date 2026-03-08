#!/bin/bash

# Configure CloudFront for React SPA
# Adds error pages and enables HTTPS redirect

set -e

DISTRIBUTION_ID="E186T1U8K9QQJI"

echo "Configuring CloudFront distribution: $DISTRIBUTION_ID"

# Get current config
aws cloudfront get-distribution-config --id $DISTRIBUTION_ID > /tmp/cf-config.json

# Extract ETag
ETAG=$(cat /tmp/cf-config.json | jq -r '.ETag')
echo "Current ETag: $ETAG"

# Update config
cat /tmp/cf-config.json | jq '.DistributionConfig | 
  .CustomErrorResponses = {
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
  } |
  .DefaultCacheBehavior.ViewerProtocolPolicy = "redirect-to-https" |
  .DefaultCacheBehavior.Compress = true' > /tmp/cf-updated.json

# Apply update
aws cloudfront update-distribution \
  --id $DISTRIBUTION_ID \
  --distribution-config file:///tmp/cf-updated.json \
  --if-match "$ETAG"

echo "CloudFront configuration updated!"
echo "Changes will take 5-10 minutes to deploy."
