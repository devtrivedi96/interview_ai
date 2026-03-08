# Fixed AWS Deployment - Interview AI Client

## The Issue

Your AWS account has S3 Block Public Access enabled, which prevents making buckets publicly accessible. This is actually a **good security practice**!

## The Solution

Use CloudFront with Origin Access Identity (OAI) instead of a public S3 bucket. This is more secure and provides better performance.

## Quick Setup (2 Steps)

### Step 1: Setup CloudFront (One-time)

```bash
cd client
./setup-cloudfront.sh
```

This script will:
1. Create an Origin Access Identity (OAI)
2. Configure S3 bucket policy for CloudFront access
3. Create CloudFront distribution
4. Give you the distribution ID and URL

**Save the output!** You'll need the `DISTRIBUTION_ID`.

Example output:
```
Distribution ID: E1234ABCD5678
Domain: d111111abcdef8.cloudfront.net
```

### Step 2: Deploy Your App

```bash
# Set the CloudFront distribution ID from Step 1
export AWS_CLOUDFRONT_DISTRIBUTION_ID=E1234ABCD5678

# Deploy
./quick-deploy.sh
```

Your site will be live at: `https://your-cloudfront-domain.cloudfront.net`

## Alternative: Manual CloudFront Setup

If the script doesn't work, use AWS Console:

### 1. Create Origin Access Identity

```bash
aws cloudfront create-cloud-front-origin-access-identity \
  --cloud-front-origin-access-identity-config \
  CallerReference="interview-ai-$(date +%s)",Comment="Interview AI OAI"
```

Save the OAI ID from the output.

### 2. Update S3 Bucket Policy

Go to S3 Console → interview-ai-client → Permissions → Bucket Policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontOAI",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity YOUR_OAI_ID"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::interview-ai-client/*"
    }
  ]
}
```

Replace `YOUR_OAI_ID` with the ID from step 1.

### 3. Create CloudFront Distribution

Go to CloudFront Console → Create Distribution:

**Origin Settings:**
- Origin Domain: `interview-ai-client.s3.us-east-1.amazonaws.com`
- Origin Access: Origin Access Identity
- Select your OAI from dropdown

**Default Cache Behavior:**
- Viewer Protocol Policy: Redirect HTTP to HTTPS
- Allowed HTTP Methods: GET, HEAD
- Compress Objects: Yes

**Settings:**
- Default Root Object: `index.html`

**Custom Error Responses:**
Add two error responses:
- HTTP Error Code: 403 → Response Page: /index.html → HTTP Response Code: 200
- HTTP Error Code: 404 → Response Page: /index.html → HTTP Response Code: 200

Click "Create Distribution" and wait 15-20 minutes for deployment.

## Update Backend CORS

After CloudFront is deployed, update your backend:

```python
# server/.env
CORS_ORIGINS=["https://your-cloudfront-domain.cloudfront.net"]
```

Restart your backend server.

## Future Deployments

Once CloudFront is set up, just run:

```bash
cd client
export AWS_CLOUDFRONT_DISTRIBUTION_ID=YOUR_ID
./quick-deploy.sh
```

## Check CloudFront Status

```bash
aws cloudfront get-distribution --id YOUR_DISTRIBUTION_ID \
  --query 'Distribution.Status' --output text
```

Status should be "Deployed" (takes 15-20 minutes initially).

## Troubleshooting

### "jq: command not found"

Install jq:
```bash
# macOS
brew install jq

# Linux
sudo apt-get install jq
```

Or edit the script to remove jq usage.

### CloudFront takes too long

This is normal. Initial deployment takes 15-20 minutes. Subsequent updates are faster.

### Still getting errors

Check IAM permissions. Your user needs:
- `cloudfront:CreateDistribution`
- `cloudfront:CreateCloudFrontOriginAccessIdentity`
- `s3:PutBucketPolicy`
- `s3:PutObject`

## Cost

- S3: ~$0.50/month
- CloudFront: ~$1-3/month (includes free tier)
- Total: ~$1-5/month

## Benefits of CloudFront

✅ HTTPS by default
✅ Global CDN (faster worldwide)
✅ Better security (no public bucket)
✅ Custom domain support
✅ DDoS protection
✅ Caching and compression

## Next Steps

1. Run `./setup-cloudfront.sh` (one-time)
2. Save the distribution ID
3. Run `./quick-deploy.sh` to deploy
4. Update backend CORS
5. Test your site!
