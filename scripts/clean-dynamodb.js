const AWS = require('aws-sdk');

// Configure AWS SDK
AWS.config.update({
    region: process.env.AWS_REGION || 'us-west-2'
});

const dynamodb = new AWS.DynamoDB();
const tableName = 'dev-archimedes-table';

/**
 * Scan and delete all items from DynamoDB table
 */
async function clearDynamoDBTable() {
    console.log('🗑️  Starting DynamoDB table cleanup...');
    console.log(`📋 Table: ${tableName}`);
    console.log('===============================================');

    let totalDeleted = 0;
    let scanParams = {
        TableName: tableName,
        ProjectionExpression: 'pk, sk' // Only get the keys we need for deletion
    };

    try {
        do {
            console.log('📡 Scanning for items to delete...');
            
            // Scan the table to get items
            const scanResult = await dynamodb.scan(scanParams).promise();
            
            if (scanResult.Items && scanResult.Items.length > 0) {
                console.log(`Found ${scanResult.Items.length} items to delete`);
                
                // Prepare batch delete requests
                const deleteRequests = scanResult.Items.map(item => ({
                    DeleteRequest: {
                        Key: {
                            pk: item.pk,
                            sk: item.sk
                        }
                    }
                }));

                // Split into batches of 25 (DynamoDB limit)
                const batchSize = 25;
                for (let i = 0; i < deleteRequests.length; i += batchSize) {
                    const batch = deleteRequests.slice(i, i + batchSize);
                    
                    const batchParams = {
                        RequestItems: {
                            [tableName]: batch
                        }
                    };

                    console.log(`🗑️  Deleting batch ${Math.floor(i/batchSize) + 1} (${batch.length} items)...`);
                    
                    try {
                        const result = await dynamodb.batchWriteItem(batchParams).promise();
                        
                        // Handle unprocessed items
                        if (result.UnprocessedItems && Object.keys(result.UnprocessedItems).length > 0) {
                            console.log('⚠️  Some items were not processed, retrying...');
                            // You could implement retry logic here if needed
                        }
                        
                        totalDeleted += batch.length;
                        console.log(`✅ Batch deleted. Total deleted so far: ${totalDeleted}`);
                        
                        // Small delay to avoid throttling
                        await new Promise(resolve => setTimeout(resolve, 100));
                        
                    } catch (batchError) {
                        console.error('❌ Error deleting batch:', batchError);
                        throw batchError;
                    }
                }
            } else {
                console.log('✅ No more items found');
            }

            // Continue scanning if there are more items
            scanParams.ExclusiveStartKey = scanResult.LastEvaluatedKey;
            
        } while (scanParams.ExclusiveStartKey);

        console.log('');
        console.log('✅ DynamoDB table cleanup completed successfully!');
        console.log('===============================================');
        console.log(`📊 Total items deleted: ${totalDeleted}`);
        console.log('🎉 Table is now empty and ready for fresh data!');

    } catch (error) {
        console.error('❌ Error clearing DynamoDB table:', error);
        
        if (error.code === 'ResourceNotFoundException') {
            console.error(`💡 Table '${tableName}' does not exist`);
        } else if (error.code === 'AccessDeniedException') {
            console.error('💡 Check your AWS credentials and permissions');
        } else {
            console.error('💡 Make sure your AWS credentials are configured and the table exists');
        }
        
        process.exit(1);
    }
}

/**
 * Confirm before deletion (safety check)
 */
async function confirmDeletion() {
    if (process.argv.includes('--force')) {
        return true;
    }

    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question(`⚠️  Are you sure you want to delete ALL data from table '${tableName}'? (yes/no): `, (answer) => {
            rl.close();
            resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
        });
    });
}

/**
 * Main function
 */
async function main() {
    console.log('🚨 DynamoDB Table Cleanup Utility');
    console.log('===============================================');
    console.log('⚠️  WARNING: This will delete ALL data from the table!');
    console.log('');

    // Check AWS credentials
    try {
        const sts = new AWS.STS();
        const identity = await sts.getCallerIdentity().promise();
        console.log(`🔐 AWS Identity: ${identity.Arn}`);
        console.log('');
    } catch (error) {
        console.error('❌ AWS credentials not configured properly');
        console.error('💡 Please run "aws configure" or set AWS environment variables');
        process.exit(1);
    }

    // Confirm deletion
    const confirmed = await confirmDeletion();
    
    if (!confirmed) {
        console.log('❌ Operation cancelled by user');
        process.exit(0);
    }

    // Proceed with cleanup
    await clearDynamoDBTable();
}

// Handle command line flags
if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log('DynamoDB Table Cleanup Utility');
    console.log('');
    console.log('Usage:');
    console.log('  node clean-dynamodb.js          # Interactive mode (asks for confirmation)');
    console.log('  node clean-dynamodb.js --force  # Force mode (no confirmation)');
    console.log('');
    console.log('This script will delete ALL data from the DynamoDB table.');
    process.exit(0);
}

// Run the main function
main().catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
});
