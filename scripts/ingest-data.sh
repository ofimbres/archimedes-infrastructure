#!/bin/bash

# Archimedes Data Processing Pipeline
# This script runs the complete data processing pipeline

set -e  # Exit on any error

echo "🚀 Starting Archimedes Data Processing Pipeline"
echo "==============================================="

# Check if required files exist
if [ ! -f "data/schools_2023_to_2024.csv" ]; then
    echo "❌ Error: Input file 'data/schools_2023_to_2024.csv' not found"
    echo "Please ensure the schools dataset is in the correct location"
    exit 1
fi

# Create output directory if it doesn't exist
mkdir -p scripts/output

echo ""
echo "📊 Step 1: Filtering CSV data for middle schools in Laredo..."
echo "Input: data/schools_2023_to_2024.csv"
echo "Output: scripts/output/filtered-schools.csv"
node scripts/filter-schools.js data/schools_2023_to_2024.csv scripts/output/filtered-schools.csv

if [ ! -f "scripts/output/filtered-schools.csv" ]; then
    echo "❌ Error: Failed to create scripts/output/filtered-schools.csv"
    exit 1
fi

echo "✅ Step 1 completed. Filtered $(wc -l < scripts/output/filtered-schools.csv) rows (including header)"

echo ""
echo "🔄 Step 2: Converting CSV to JSON..."
echo "Input: scripts/output/filtered-schools.csv"
echo "Output: scripts/output/schools.json"
node scripts/csv-to-json.js scripts/output/filtered-schools.csv scripts/output/schools.json

if [ ! -f "scripts/output/schools.json" ]; then
    echo "❌ Error: Failed to create schools.json"
    exit 1
fi

echo "✅ Step 2 completed. JSON file created"

echo ""
echo "🗃️  Step 3: Creating DynamoDB data structure..."
echo "Input: scripts/output/schools.json (+ other data files)"
echo "Output: scripts/output/dynamodb-data-to-seed.json"
node scripts/create-dynamodb-data.js

if [ ! -f "scripts/output/dynamodb-data-to-seed.json" ]; then
    echo "❌ Error: Failed to create DynamoDB data structure"
    exit 1
fi

echo "✅ Step 3 completed. DynamoDB data structure created"

echo ""
echo "📤 Step 4: Seeding DynamoDB..."
echo "Input: scripts/output/dynamodb-data-to-seed.json"
echo "Output: Data uploaded to DynamoDB"

# Check AWS credentials before attempting to seed
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ Error: AWS credentials not configured"
    echo "Please run 'aws configure' or set AWS environment variables"
    exit 1
fi

node scripts/seed-data.js

echo ""
echo "📤 Step 5: Uploading miniquizzes to S3..."
echo "Input: data/miniquizzes.zip"
echo "Output: Files uploaded to S3 bucket"

# Check if miniquizzes.zip exists
if [ ! -f "data/miniquizzes.zip" ]; then
    echo "❌ Error: data/miniquizzes.zip not found"
    echo "Please ensure the miniquizzes.zip file is in the data directory"
    exit 1
fi

node scripts/upload-miniquizzes-to-s3.js

echo ""
echo "✅ Data processing pipeline completed successfully!"
echo "==============================================="
echo ""
echo "📋 Summary:"
echo "- Filtered schools data: scripts/output/filtered-schools.csv"
echo "- JSON data: scripts/output/schools.json" 
echo "- DynamoDB data: scripts/output/dynamodb-data-to-seed.json"
echo "- Data uploaded to DynamoDB table"
echo "- Miniquizzes uploaded to S3 bucket"
echo ""
echo "🎉 Pipeline finished!"
