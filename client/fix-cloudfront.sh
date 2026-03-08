#!/bin/bash

# Fix CloudFront Distribution to use S3 with OAI
# This fixes the XML error you're seeing

set -e

DISTRIBUTION_ID="E186T1U8K9QQJI"
OAI_ID="EYQ8HYFHVVEOB"
S3_BUCKET="interview-ai-client"

echo "Fixing CloudFront distribution..."

# Get current config and ETag
aws cloudfront get-distribution-config --id $DISTRIBUTION_ID > /tmp/cf-full.json
ETAG=$(cat /tmp/cf-full.json | jq -r '.ETag')

echo "Current ETag: $ETAG"

# Update the configuration
cat /tmp/cf-full.json | jq --arg bucket "$S3_BUCKET" --arg oai "$OAI_ID" '
.DistributionConfig |
.Origins.Items[0] = {
  "Id": "S3-interview-ai-client",
  "DomainName": ($bucket + ".s3.us-east-1.amazonaws.com"),
  "OriginPath": "",
  "CustomHeaders": {
    "Quantity": 0
  },
  "S3OriginConfig": {
    "OriginAccessIdentity": ("origin-access-identity/cloudfront/" + $oai)
  },
  "ConnectionAttempts": 3,
  "ConnectionTimeout": 10,
  "OriginShield": {
    "Enabled": false
  }
} |
.DefaultCacheBehavior.TargetOriginId = "S3-interview-ai-client" |
.DefaultCacheBehavior.ViewerProtocolPolicy = "redirect-to-https" |
.DefaultCacheBehavior.Compress = true |
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
}
' > /tmp/cf-fixed.json

# Apply the update
echo "Applying configuration..."
aws cloudfront update-distribution \
  --id $DISTRIBUTION_ID \
  --distribution-config file:///tmp/cf-fixed.json \
  --if-match "$ETAG" > /tmp/update-result.json

echo "✅ CloudFront configuration updated!"
echo ""
echo "Now updating S3 bucket policy for OAI access..."

# Update S3 bucket policy
cat > /tmp/bucket-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontOAI",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity $OAI_ID"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$S3_BUCKET/*"
    }
  ]
}
EOF

# Update bucket policy
aws s3api put-bucket-policy \
  --bucket $S3_BUCKET \
  --policy file:///tmp/bucket-policy.json

echo "✅ S3 bucket policy updated!"
echo ""
echo "🎉 All done! Your site will be ready in 5-10 minutes."
echo ""
echo "Check status:"
echo "  aws cloudfront get-distribution --id $DISTRIBUTION_ID --query 'Distribution.Status' --output text"
echo ""
echo "Your site: https://dss31jv9ppnau.cloudfront.net"

# Cleanup
rm -f /tmp/cf-full.json /tmp/cf-fixed.json /tmp/bucket-policy.json /tmp/update-result.json
