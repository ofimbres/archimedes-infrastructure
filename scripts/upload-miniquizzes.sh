#!/bin/bash

set -e

# Zip to use (default: data/miniquizzes_2026.zip). Pass as first arg to override.
ZIP_FILE="${1:-./data/miniquizzes_2026.zip}"
MINIQUIZZES_DIR="./data/miniquizzes"
STAGING_DIR="./data/miniquizzes_staging"

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

# Unzip if zip file exists; otherwise require existing miniquizzes dir
if [ -f "$ZIP_FILE" ]; then
    echo "📂 Unzipping $ZIP_FILE..."
    rm -rf "$STAGING_DIR" "$MINIQUIZZES_DIR"
    unzip -o -q "$ZIP_FILE" -d "$STAGING_DIR"
    # If zip has a single top-level dir (e.g. miniquizzes_2026/), use it as miniquizzes
    SUBDIRS=("$STAGING_DIR"/*)
    if [ -d "${SUBDIRS[0]}" ] && [ "${#SUBDIRS[@]}" -eq 1 ]; then
        mv "${SUBDIRS[0]}" "$MINIQUIZZES_DIR"
    else
        mkdir -p "$MINIQUIZZES_DIR"
        mv "$STAGING_DIR"/* "$MINIQUIZZES_DIR/" 2>/dev/null || true
    fi
    rm -rf "$STAGING_DIR"
    echo "   Extracted to $MINIQUIZZES_DIR"
elif [ ! -d "$MINIQUIZZES_DIR" ]; then
    echo "❌ Error: No zip at $ZIP_FILE and ./data/miniquizzes not found."
    echo "   Usage: $0 [path/to/miniquizzes_2026.zip]"
    exit 1
fi

# Sync from html_files/ if present so URLs are at root (e.g. /AL01.html not /html_files/AL01.html)
UPLOAD_SOURCE="$MINIQUIZZES_DIR"
if [ -d "$MINIQUIZZES_DIR/html_files" ]; then
    UPLOAD_SOURCE="$MINIQUIZZES_DIR/html_files"
fi
FILE_COUNT=$(find "$UPLOAD_SOURCE" -name "*.html" 2>/dev/null | wc -l)
echo "📁 Found $FILE_COUNT miniquizzes to upload (from $UPLOAD_SOURCE)"

# Sync miniquizzes to S3 (at bucket root for clean URLs)
echo "⬆️  Uploading miniquizzes to S3..."
aws s3 sync "$UPLOAD_SOURCE" s3://$BUCKET_NAME \
    --delete \
    --cache-control "public, max-age=31536000" \
    --content-type "text/html"

echo "✅ Upload complete!"

# Get CloudFront distribution ID and invalidate cache
echo "🔄 Getting CloudFront distribution ID..."
DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
    --stack-name ArchimedesStaticHtmlStack \
    --query 'Stacks[0].Outputs[?OutputKey==`DistributionId`].OutputValue' \
    --output text)

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
echo "🔗 Your miniquizzes are available at: $CLOUDFRONT_URL/"
echo ""
echo "📋 Example URLs:"
echo "   $CLOUDFRONT_URL/AL01.html"
echo "   $CLOUDFRONT_URL/AN01.html"
echo "   $CLOUDFRONT_URL/CF01.html"
