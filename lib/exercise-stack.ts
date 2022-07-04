//import * as cdk from "@aws-cdk/core";
//import * as s3 from "@aws-cdk/aws-s3";
//import * as iam from "aws-iam";
import * as cdk from 'aws-cdk-lib';
import { aws_iam as iam, aws_s3 as s3,
         aws_s3_deployment as s3Deployment,
         aws_dynamodb as dynamodb,
         Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class ExerciseStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    // Create the public S3 bucket
    const exerciseResultsBucket = new s3.Bucket(this, 'archimedes-exercise-results-bucket', {
      bucketName: 'archimedes-exercise-results2',
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          expiration: cdk.Duration.days(365),
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
    });

    // Deploy static code/files into Bucket.
    new s3Deployment.BucketDeployment(
      this,
      'deployDefaultObjects',
      {
        sources: [s3Deployment.Source.asset('./resources/exercise-results-default-content')],
        destinationBucket: exerciseResultsBucket,
      }
    );

    // Create the public S3 bucket
    const miniQuizzesBucket = new s3.Bucket(this, 'archimedes-mini-quizzes-bucket', {
      bucketName: 'archimedes-mini-quizzes2',
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          expiration: cdk.Duration.days(365),
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
    });

    // Deploy static code/files into Bucket.
    new s3Deployment.BucketDeployment(
      this,
      'deployDefaultObjects2',
      {
        sources: [s3Deployment.Source.asset('./resources/exercises-default-content')],
        destinationBucket: miniQuizzesBucket,
      }
    );

    const exerciseResultsTable = new dynamodb.Table(this, 'archimedes-exercise-results-table', {
      partitionKey: {
        name: 'id', // STUDENT#123#EXERCISE#WN1
        type: dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: 'created_at', // 123456
        type: dynamodb.AttributeType.NUMBER
      },
      tableName: 'ArchimedesExerciseResults',
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    new cdk.custom_resources.AwsCustomResource(this, 'initDBResource', {
      onCreate: {
        service: 'DynamoDB',
        action: 'putItem',
        parameters: {
          TableName: 'ArchimedesExerciseResults',
          Item: { id: { S: 'STUDENT#1004EXERCISE#WN16' }, created_at: { N: '1628957203942' }, score: { N: '20' } },
        },
        physicalResourceId: cdk.custom_resources.PhysicalResourceId.of('initDBResource'),
      },
      policy: cdk.custom_resources.AwsCustomResourcePolicy.fromSdkCalls({
        resources: cdk.custom_resources.AwsCustomResourcePolicy.ANY_RESOURCE,
      }),
    });

    const exercisesTable = new dynamodb.Table(this, 'archimedes-exercises-table', {
      partitionKey: {
        name: 'code', // WN04
        type: dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: 'sk', // METADATA#WN04
        type: dynamodb.AttributeType.STRING
      },
      tableName: 'ArchimedesExercises',
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    new cdk.custom_resources.AwsCustomResource(this, 'initDBResource2', {
      onCreate: {
        service: 'DynamoDB',
        action: 'batchWriteItem',
        parameters: {
          RequestItems: {
            ['ArchimedesExercises']:
                [
                    { PutRequest: { Item: { code: { S: 'WN04' }, sk: { S: 'METADATA#WN04' }, name: { S: 'Adding Whole Numbers' }, s3Location: { S: 'WN04.htm' }, type: { S: 'miniquiz' } } } },
                    { PutRequest: { Item: { code: { S: 'WN04' }, sk: { S: 'TOPIC#wholenumbers/add' }, indexName: { S: 'Whole Numbers / Add' } } } },
                    { PutRequest: { Item: { code: { S: 'WN16' }, sk: { S: 'METADATA#WN16' }, name: { S: 'Multiplying Whole Numbers' }, s3Location: { S: 'WN16.htm' }, type: { S: 'miniquiz' } } } },
                    { PutRequest: { Item: { code: { S: 'WN16' }, sk: { S: 'TOPIC#wholenumbers/multiply' }, indexName: { S: 'Whole Numbers / Multiply' } } } },
                ]
          },
        },
        physicalResourceId: cdk.custom_resources.PhysicalResourceId.of('initDBResource2'),
      },
      policy: cdk.custom_resources.AwsCustomResourcePolicy.fromSdkCalls({
        resources: cdk.custom_resources.AwsCustomResourcePolicy.ANY_RESOURCE,
      }),
    });
  }
}