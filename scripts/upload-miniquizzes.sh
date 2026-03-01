#!/bin/bash

set -e

echo "🔍 Getting S3 bucket name from CDK stack..."

# Get the bucket name from CDK outputs
BUCKET_NAME=$(aws cloudformation describe-stacks \
    --stack-name ArchimedesStaticHtmlStack \
    --query 'Stacks[0].Outputs[?OutputKey==`S3BucketName`].OutputValue' \
    --output text)

if [ -z "$BUCKET_NAME" ]; then
    echo "❌ Error: Could not find S3 bucket name. Make sure the stack is deployed."
    exit 1
fi

echo "📦 Found bucket: $BUCKET_NAME"

# Check if miniquizzes directory exists
if [ ! -d "./data/miniquizzes" ]; then
    echo "❌ Error: ./data/miniquizzes directory not found"
    exit 1
fi

# Count files to upload
FILE_COUNT=$(find ./data/miniquizzes -name "*.html" | wc -l)
echo "📁 Found $FILE_COUNT miniquizzes to upload"

# Sync miniquizzes to S3
echo "⬆️  Uploading miniquizzes to S3..."
aws s3 sync ./data/miniquizzes s3://$BUCKET_NAME \
    --delete \
    --cache-control "public, max-age=31536000" \
    --content-type "text/html"

echo "✅ Upload complete!"

# Get CloudFront distribution ID and invalidate cache
echo "🔄 Getting CloudFront distribution ID..."
DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
    --stack-name ArchimedesStaticHtmlStack \
    --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontUrl`].OutputValue' \
    --output text | sed 's/https:\/\///' | sed 's/\.cloudfront\.net//' | cut -d'.' -f1)

if [ -n "$DISTRIBUTION_ID" ]; then
    echo "🌐 Creating CloudFront cache invalidation..."
    INVALIDATION_ID=$(aws cloudfront create-invalidation \
        --distribution-id $DISTRIBUTION_ID \
        --paths "/*" \
        --query 'Invalidation.Id' \
        --output text)
    
    echo "⏳ Invalidation created with ID: $INVALIDATION_ID"
    echo "   Cache invalidation may take 10-15 minutes to complete"
else
    echo "⚠️  Could not determine CloudFront distribution ID for cache invalidation"
fi

# Get the CloudFront URL for easy access
CLOUDFRONT_URL=$(aws cloudformation describe-stacks \
    --stack-name ArchimedesStaticHtmlStack \
    --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontUrl`].OutputValue' \
    --output text)

echo ""
echo "🎉 Deployment complete!"
echo "🔗 Your miniquizzes are available at: $CLOUDFRONT_URL"
echo ""
echo "📋 Example URLs:"
echo "   $CLOUDFRONT_URL/AL01.html"
echo "   $CLOUDFRONT_URL/AN01.html"
echo "   $CLOUDFRONT_URL/CF01.html"
