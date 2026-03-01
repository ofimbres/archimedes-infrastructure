# Custom Domain Setup Guide

This guide explains how to configure and deploy a custom domain for your Archimedes static HTML hosting.

## Overview

The CDK stack now supports custom domains with:
- SSL/TLS certificate via AWS Certificate Manager (ACM)
- Route 53 hosted zone (optional)
- CloudFront distribution with custom domain names
- Automatic DNS records for root and www subdomains

## Cost Implications

Adding a custom domain will increase your monthly costs:
- Route 53 hosted zone: ~$0.50/month
- ACM certificate: Free
- No additional CloudFront costs
- **Total additional cost: ~$0.50/month**

## Configuration Options

### Option 1: Use Existing Domain/Hosted Zone
If you already own a domain and have it configured in Route 53:

```typescript
// In bin/app.ts
const CUSTOM_DOMAIN = 'yourdomain.com';
const USE_CUSTOM_DOMAIN = true;
const CREATE_HOSTED_ZONE = false; // Set to false if zone exists
```

### Option 2: Create Everything New
If you want to register a new domain or create a new hosted zone:

```typescript
// In bin/app.ts
const CUSTOM_DOMAIN = 'archimedes-worksheets.yourdomain.com';
const USE_CUSTOM_DOMAIN = true;
const CREATE_HOSTED_ZONE = true;
```

### Option 3: Keep Current Setup (Default)
To continue using the CloudFront domain without custom domain:

```typescript
// In bin/app.ts
const USE_CUSTOM_DOMAIN = false;
```

## Setup Steps

### 1. Update Configuration
Edit [bin/app.ts](../bin/app.ts) and set your domain preferences:

```typescript
const CUSTOM_DOMAIN = 'your-actual-domain.com';
const USE_CUSTOM_DOMAIN = true;
const CREATE_HOSTED_ZONE = true; // or false if you have existing hosted zone
```

### 2. Deploy the Stack
```bash
cdk deploy
```

**Important**: The deployment will create the certificate and wait for DNS validation. This process can take 20-30 minutes.

### 3. Update Domain Registration (if using new hosted zone)
If `CREATE_HOSTED_ZONE = true`, you'll need to:

1. Note the name servers from the CloudFormation output
2. Update your domain registrar to use these name servers
3. Wait for DNS propagation (up to 48 hours)

### 4. Verify Certificate Validation
The ACM certificate uses DNS validation. If you're using an existing hosted zone, ensure the validation CNAME records are created automatically.

## DNS Records Created

The stack automatically creates:
- `yourdomain.com` → CloudFront distribution (A record)
- `www.yourdomain.com` → CloudFront distribution (A record)

## Troubleshooting

### Certificate Validation Timeout
- Ensure DNS is properly configured
- Check that the hosted zone has the correct name servers
- Verify CNAME validation records exist

### Domain Not Accessible
- Wait for DNS propagation (up to 48 hours)
- Check CloudFront distribution status
- Verify certificate is issued and valid

### Rollback to CloudFront Domain
Set `USE_CUSTOM_DOMAIN = false` and redeploy to remove custom domain configuration.

## Security Features

- Automatic HTTPS redirect
- SSL/TLS certificate with 90-day auto-renewal
- Both root domain and www subdomain supported
- CloudFront security headers and caching

## Monitoring

After deployment, monitor:
- Certificate expiration (auto-renewed by ACM)
- Route 53 query logs (optional)
- CloudFront access logs (if enabled)

## Example Domain Configuration

For a production setup with domain `mathworksheets.edu`:

```typescript
const CUSTOM_DOMAIN = 'mathworksheets.edu';
const USE_CUSTOM_DOMAIN = true;
const CREATE_HOSTED_ZONE = false; // Assuming existing .edu domain management
```

This would make your worksheets available at:
- `https://mathworksheets.edu`
- `https://www.mathworksheets.edu`

Both domains would redirect to HTTPS and serve your HTML worksheet content.
