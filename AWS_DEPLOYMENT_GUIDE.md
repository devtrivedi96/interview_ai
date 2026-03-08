# AWS Deployment Guide - Interview AI Client

This guide will help you deploy the React client to AWS using S3 and CloudFront.

## Architecture

```
User → CloudFront (CDN) → S3 (Static Website) → Backend API
```

- **S3**: Hosts the static React build files
- **CloudFront**: CDN for fast global delivery and HTTPS
- **Route 53** (Optional): Custom domain management

## Prerequisites

1. AWS Account
2. AWS CLI installed and configured
3. Appropriate IAM permissions

### Install AWS CLI

```bash
# macOS
brew install awscli

# Linux
pip install awscli

# Windows
# Download from: https://aws.amazon.com/cli/
```

### Configure AWS CLI

```bash
aws configure
# Enter:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region (e.g., us-east-1)
# - Default output format (json)
```

## Deployment Methods

### Method 1: Automated Script (Recommended)

#### Step 1: Set Environment Variables

Create or update `client/.env.production`:

```env
VITE_API_URL=https://api.your-domain.com/api/v1
# ... other Firebase config
```

#### Step 2: Set AWS Configuration

```bash
export AWS_S3_BUCKET=interview-ai-client
export AWS_REGION=us-east-1
export AWS_CLOUDFRONT_DISTRIBUTION_ID=YOUR_DISTRIBUTION_ID  # Optional
```

Or create `client/.env.aws`:

```env
AWS_S3_BUCKET=interview-ai-client
AWS_REGION=us-east-1
AWS_CLOUDFRONT_DISTRIBUTION_ID=YOUR_DISTRIBUTION_ID
```

#### Step 3: Run Deployment Script

```bash
cd client
./deploy-aws.sh
```

The script will:
1. Install dependencies
2. Build the application
3. Create S3 bucket (if needed)
4. Upload files to S3
5. Invalidate CloudFront cache (if configured)

### Method 2: Manual Deployment

#### Step 1: Build the Application

```bash
cd client
npm install
npm run build
```

#### Step 2: Create S3 Bucket

```bash
# Create bucket
aws s3 mb s3://interview-ai-client --region us-east-1

# Enable static website hosting
aws s3 website s3://interview-ai-client \
  --index-document index.html \
  --error-document index.html
```

#### Step 3: Configure Bucket Policy

Create `bucket-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::interview-ai-client/*"
    }
  ]
}
```

Apply policy:

```bash
aws s3api put-bucket-policy \
  --bucket interview-ai-client \
  --policy file://bucket-policy.json
```

#### Step 4: Upload Files

```bash
# Upload all files
aws s3 sync dist/ s3://interview-ai-client/ \
  --delete \
  --cache-control "public, max-age=31536000" \
  --exclude "index.html"

# Upload index.html with no-cache
aws s3 cp dist/index.html s3://interview-ai-client/index.html \
  --cache-control "no-cache, no-store, must-revalidate"
```

#### Step 5: Access Your Site

```
http://interview-ai-client.s3-website-us-east-1.amazonaws.com
```

## CloudFront Setup (Recommended for Production)

CloudFront provides:
- HTTPS support
- Global CDN
- Custom domain support
- Better performance

### Step 1: Create CloudFront Distribution

```bash
aws cloudfront create-distribution \
  --origin-domain-name interview-ai-client.s3-website-us-east-1.amazonaws.com \
  --default-root-object index.html
```

Or use AWS Console:

1. Go to CloudFront console
2. Click "Create Distribution"
3. Configure:
   - **Origin Domain**: Select your S3 bucket
   - **Origin Path**: Leave empty
   - **Viewer Protocol Policy**: Redirect HTTP to HTTPS
   - **Allowed HTTP Methods**: GET, HEAD, OPTIONS
   - **Cache Policy**: CachingOptimized
   - **Default Root Object**: index.html

### Step 2: Configure Error Pages

Add custom error response for SPA routing:

- **HTTP Error Code**: 403, 404
- **Response Page Path**: /index.html
- **HTTP Response Code**: 200

### Step 3: Get Distribution ID

```bash
aws cloudfront list-distributions --query "DistributionList.Items[*].[Id,DomainName]" --output table
```

Save the Distribution ID for cache invalidation.

### Step 4: Update Environment Variable

```bash
export AWS_CLOUDFRONT_DISTRIBUTION_ID=YOUR_DISTRIBUTION_ID
```

## Custom Domain Setup (Optional)

### Step 1: Request SSL Certificate

```bash
aws acm request-certificate \
  --domain-name your-domain.com \
  --validation-method DNS \
  --region us-east-1
```

### Step 2: Validate Certificate

Follow the DNS validation instructions in ACM console.

### Step 3: Add Custom Domain to CloudFront

1. Go to CloudFront distribution settings
2. Edit "Alternate Domain Names (CNAMEs)"
3. Add your domain: `your-domain.com`
4. Select your SSL certificate

### Step 4: Update Route 53

Create an A record (Alias) pointing to your CloudFront distribution.

## CI/CD with GitHub Actions

Create `.github/workflows/deploy-client.yml`:

```yaml
name: Deploy Client to AWS

on:
  push:
    branches: [main]
    paths:
      - 'client/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        working-directory: ./client
        run: npm ci
        
      - name: Build
        working-directory: ./client
        run: npm run build
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          # ... other env vars
          
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
          
      - name: Deploy to S3
        working-directory: ./client
        run: |
          aws s3 sync dist/ s3://${{ secrets.AWS_S3_BUCKET }}/ \
            --delete \
            --cache-control "public, max-age=31536000" \
            --exclude "index.html"
          
          aws s3 cp dist/index.html s3://${{ secrets.AWS_S3_BUCKET }}/index.html \
            --cache-control "no-cache"
            
      - name: Invalidate CloudFront
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.AWS_CLOUDFRONT_DISTRIBUTION_ID }} \
            --paths "/*"
```

### GitHub Secrets to Add

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_S3_BUCKET`
- `AWS_CLOUDFRONT_DISTRIBUTION_ID`
- `VITE_API_URL`
- All Firebase config variables

## Backend CORS Configuration

Update your backend to allow the new domain:

```python
# server/.env
CORS_ORIGINS=["https://your-cloudfront-domain.cloudfront.net","https://your-domain.com"]
```

## Cost Estimation

### S3 Costs
- Storage: ~$0.023 per GB/month
- Requests: ~$0.0004 per 1,000 GET requests
- Data transfer: First 1 GB free, then ~$0.09 per GB

### CloudFront Costs
- Data transfer: First 1 TB free (12 months), then ~$0.085 per GB
- Requests: ~$0.0075 per 10,000 HTTPS requests

**Estimated monthly cost for small app**: $1-5

## Monitoring and Maintenance

### View Logs

```bash
# S3 access logs
aws s3 ls s3://interview-ai-client-logs/

# CloudFront logs
aws cloudfront get-distribution --id YOUR_DISTRIBUTION_ID
```

### Monitor Costs

```bash
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost
```

### Update Deployment

```bash
cd client
./deploy-aws.sh
```

## Troubleshooting

### Issue: 403 Forbidden

**Solution**: Check bucket policy allows public read access

### Issue: 404 on Refresh

**Solution**: Configure CloudFront error pages to return index.html

### Issue: Old Content Showing

**Solution**: Invalidate CloudFront cache

```bash
aws cloudfront create-invalidation \
  --distribution-id YOUR_ID \
  --paths "/*"
```

### Issue: CORS Errors

**Solution**: Update backend CORS_ORIGINS to include CloudFront domain

## Security Best Practices

1. **Use CloudFront**: Always use CloudFront for HTTPS
2. **Restrict S3 Access**: Use CloudFront Origin Access Identity
3. **Enable WAF**: Protect against common attacks
4. **Monitor Access**: Enable CloudFront and S3 logging
5. **Use Secrets Manager**: For sensitive configuration
6. **Enable MFA**: On AWS account
7. **Regular Updates**: Keep dependencies updated

## Rollback

If deployment fails:

```bash
# List previous versions
aws s3api list-object-versions --bucket interview-ai-client

# Restore previous version
aws s3api copy-object \
  --copy-source interview-ai-client/index.html?versionId=VERSION_ID \
  --bucket interview-ai-client \
  --key index.html
```

## Next Steps

1. Deploy the backend to AWS (EC2, ECS, or Lambda)
2. Set up custom domain
3. Configure CI/CD pipeline
4. Enable monitoring and alerts
5. Set up backup strategy

## Resources

- [AWS S3 Static Website Hosting](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html)
- [CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)
- [AWS CLI Reference](https://docs.aws.amazon.com/cli/)
