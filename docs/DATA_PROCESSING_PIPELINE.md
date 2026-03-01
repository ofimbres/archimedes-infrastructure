# Data Processing Pipeline Documentation

This document outlines the complete data processing pipeline for the Archimedes Infrastructure project, from filtering CSV data to seeding DynamoDB.

## Overview

The data processing pipeline consists of 4 main steps:
1. **Filter CSV Data** - Extract middle schools in Laredo
2. **Convert CSV to JSON** - Transform filtered data to JSON format
3. **Create DynamoDB Data** - Format data for DynamoDB insertion
4. **Seed Database** - Upload data to DynamoDB

## Prerequisites

- Node.js installed
- AWS CLI configured (for DynamoDB operations)
- Required npm packages installed

```bash
npm install aws-sdk csv-parser csv-writer --save-dev
```

## Step-by-Step Instructions

### Step 1: Filter CSV Data

Filter the schools dataset to include only middle schools in Laredo.

```bash
# Filter schools data
node scripts/basic-filter.js assets/data/schools_2023_to_2024.csv filtered-schools.csv
```

**Input:** `assets/data/schools_2023_to_2024.csv` (original schools dataset)  
**Output:** `filtered-schools.csv` (middle schools in Laredo only)

**What it does:**
- Filters for rows containing "MIDDLE" and "LAREDO"
- Excludes schools "Under Construction"
- Creates a clean CSV with only operational middle schools

### Step 2: Convert CSV to JSON

Convert the filtered CSV data to JSON format for easier processing.

```bash
# Convert filtered CSV to JSON
node scripts/csv-to-json.js filtered-schools.csv scripts/output/schools.json
```

**Input:** `filtered-schools.csv`  
**Output:** `scripts/output/schools.json`

**What it does:**
- Converts CSV format to JSON array
- Makes data structure more suitable for JavaScript processing
- Preserves all school information and metadata

### Step 3: Create DynamoDB Data Structure

Transform the JSON data into DynamoDB-compatible format with proper partition keys and sort keys.

```bash
# Create DynamoDB-formatted data
node scripts/create-dynamodb-data.js
```

**Input:** `scripts/output/schools.json` (and other data files)  
**Output:** `scripts/output/dynamodb-data-to-seed.json`

**What it does:**
- Creates proper DynamoDB item structure with pk/sk
- Formats school data with DynamoDB attribute types (S, N, etc.)
- Combines multiple data sources (schools, mini-quizzes, etc.)
- Outputs batch write format for DynamoDB

### Step 4: Seed DynamoDB

Upload the formatted data to DynamoDB using batch operations.

```bash
# Seed DynamoDB with processed data
node scripts/seed-data.js
```

**Input:** `scripts/output/dynamodb-data-to-seed.json`  
**Output:** Data inserted into DynamoDB table

**What it does:**
- Reads the DynamoDB-formatted JSON file
- Performs batch write operations (25 items per batch)
- Handles chunking for large datasets
- Provides timing and progress feedback

## Complete Pipeline Command

You can run all steps sequentially with this command:

```bash
# Run complete data processing pipeline
echo "🚀 Starting complete data processing pipeline..."

echo "📊 Step 1: Filtering CSV data..."
node scripts/basic-filter.js assets/data/schools_2023_to_2024.csv filtered-schools.csv

echo "🔄 Step 2: Converting CSV to JSON..."
node scripts/csv-to-json.js filtered-schools.csv scripts/output/schools.json

echo "🗃️  Step 3: Creating DynamoDB data structure..."
node scripts/create-dynamodb-data.js

echo "📤 Step 4: Seeding DynamoDB..."
node scripts/seed-data.js

echo "✅ Pipeline completed successfully!"
```

## File Structure

```
archimedes-infrastructure/
├── assets/data/
│   └── schools_2023_to_2024.csv      # Original dataset
├── scripts/
│   ├── basic-filter.js               # Step 1: CSV filtering
│   ├── csv-to-json.js               # Step 2: CSV to JSON conversion
│   ├── create-dynamodb-data.js      # Step 3: DynamoDB formatting
│   ├── seed-data.js                 # Step 4: Database seeding
│   └── output/
│       ├── schools.json             # Intermediate JSON data
│       └── dynamodb-data-to-seed.json # Final DynamoDB format
├── filtered-schools.csv              # Filtered CSV output
└── package.json
```

## Configuration

### AWS Configuration
Make sure your AWS credentials are configured:

```bash
aws configure
# or set environment variables:
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_DEFAULT_REGION=us-west-2
```

### DynamoDB Table
The scripts expect a DynamoDB table named `dev-archimedes-table` in the `us-west-2` region. Update the table name in `seed-data.js` if needed:

```javascript
const tableName = 'your-table-name'
```

## Troubleshooting

### Common Issues

1. **File not found errors:**
   - Ensure input files exist in the expected locations
   - Check file permissions

2. **AWS credential errors:**
   - Verify AWS CLI is configured: `aws sts get-caller-identity`
   - Check IAM permissions for DynamoDB operations

3. **DynamoDB write failures:**
   - Verify table exists and is active
   - Check item size limits (400KB per item)
   - Monitor write capacity units

4. **Memory issues with large datasets:**
   - Process data in smaller batches
   - Monitor Node.js heap usage

### Validation Commands

```bash
# Check if filtered data was created correctly
wc -l filtered-schools.csv

# Validate JSON structure
node -e "console.log('Valid JSON:', !!JSON.parse(require('fs').readFileSync('./scripts/output/schools.json')))"

# Check DynamoDB table item count
aws dynamodb scan --table-name dev-archimedes-table --select "COUNT"
```

## Performance Notes

- **Step 1 (Filtering):** Usually completes in seconds
- **Step 2 (CSV to JSON):** Fast for typical datasets
- **Step 3 (DynamoDB formatting):** Depends on data complexity
- **Step 4 (Database seeding):** Limited by DynamoDB write capacity

## Monitoring

The seed script provides timing information:
```
HowFastWasThat: 2.345s
```

For production deployments, consider:
- Setting up CloudWatch monitoring
- Using DynamoDB auto-scaling
- Implementing retry logic for failed writes

---

## Quick Reference

| Script | Purpose | Input | Output |
|--------|---------|-------|--------|
| `basic-filter.js` | Filter CSV | Raw schools CSV | Filtered CSV |
| `csv-to-json.js` | Convert format | Filtered CSV | JSON array |
| `create-dynamodb-data.js` | Format for DB | JSON + other data | DynamoDB JSON |
| `seed-data.js` | Upload to DB | DynamoDB JSON | Data in DynamoDB |
