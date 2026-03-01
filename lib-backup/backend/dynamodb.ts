import * as cdk from 'aws-cdk-lib';
import { RemovalPolicy, aws_dynamodb as dynamodb } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class DynamoDb extends Construct {
    constructor(scope: Construct, id: string, stage: string) {
      super(scope, id);
      
      let dynamodb_table = new dynamodb.Table(this, 'data-table', {
        partitionKey: {
          name: 'pk',
          type: dynamodb.AttributeType.STRING
        },
        sortKey: {
          name: 'sk',
          type: dynamodb.AttributeType.STRING
        },
        tableName: `${stage}-archimedes-table`,
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      });
  
      // add global secondary indexes
      dynamodb_table.addGlobalSecondaryIndex({
        indexName: 'gsi1',
        partitionKey: { name: 'gsi1pk', type: dynamodb.AttributeType.STRING },
        sortKey: { name: 'gsi1sk', type: dynamodb.AttributeType.STRING },
        projectionType: dynamodb.ProjectionType.ALL,
      });
  
      dynamodb_table.addGlobalSecondaryIndex({
        indexName: 'gsi2',
        partitionKey: { name: 'gsi2pk', type: dynamodb.AttributeType.STRING },
        sortKey: { name: 'gsi2sk', type: dynamodb.AttributeType.STRING },
        projectionType: dynamodb.ProjectionType.ALL,
      });
  }
}