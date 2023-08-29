import * as cdk from 'aws-cdk-lib';
import { aws_dynamodb as dynamodb } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class Database extends Construct {
    constructor(scope: Construct, id: string) {
      super(scope, id);

      let dynamodb_table = new dynamodb.Table(this, 'archimedes-data-table', {
        partitionKey: {
          name: 'pk',
          type: dynamodb.AttributeType.STRING
        },
        sortKey: {
          name: 'sk',
          type: dynamodb.AttributeType.STRING
        },
        tableName: 'ArchimedesData',
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
      });
  
      // add global secondary indexes
      dynamodb_table.addGlobalSecondaryIndex({
        indexName: 'gsi1',
        partitionKey: { name: 'gsipk', type: dynamodb.AttributeType.STRING },
        sortKey: { name: 'gsisk', type: dynamodb.AttributeType.STRING },
        projectionType: dynamodb.ProjectionType.ALL,
      });
  
      dynamodb_table.addGlobalSecondaryIndex({
        indexName: 'gsi2',
        partitionKey: { name: 'gsipk2', type: dynamodb.AttributeType.STRING },
        sortKey: { name: 'gsisk2', type: dynamodb.AttributeType.STRING },
        projectionType: dynamodb.ProjectionType.ALL,
      });
  }
}