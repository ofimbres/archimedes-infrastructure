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
    const exerciseResultsBucket = new s3.Bucket(this, 'archimedes-exercise-results-bucket2', {
      bucketName: 'archimedes-exercise-results3',
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
      'deployDefaultObjects4',
      {
        sources: [s3Deployment.Source.asset('./resources/exercise-results-default-content')],
        destinationBucket: exerciseResultsBucket,
      }
    );

    // Create the public S3 bucket
    const miniQuizzesBucket = new s3.Bucket(this, 'archimedes-mini-quizzes-bucket2', {
      bucketName: 'archimedes-mini-quizzes3',
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
      'deployDefaultObjects3',
      {
        sources: [s3Deployment.Source.asset('./resources/exercises-default-content')],
        destinationBucket: miniQuizzesBucket,
      }
    );

    const dataTable = new dynamodb.Table(this, 'archimedes-data-table3', {
      partitionKey: {
        name: 'pk',
        type: dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: 'sk',
        type: dynamodb.AttributeType.STRING
      },
      tableName: 'ArchimedesData3',
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // add global secondary index
    dataTable.addGlobalSecondaryIndex({
      indexName: 'gsi1',
      partitionKey: { name: 'gsipk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'gsisk', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    new cdk.custom_resources.AwsCustomResource(this, 'initDBResource3', {
      onCreate: {
        service: 'DynamoDB',
        action: 'batchWriteItem',
        parameters: {
          RequestItems: {
            ['ArchimedesData3']:
                [
                    { PutRequest: { Item: { pk: { S: 'STUDENT#OSCAR' }, sk: { S: 'STUDENT#OSCAR' }, type: { S: 'STUDENT' }, name: { S: 'Oscar' },  } } },
                    { PutRequest: { Item: { pk: { S: 'STUDENT#TOM' }, sk: { S: 'STUDENT#TOM' }, type: { S: 'STUDENT' }, name: { S: 'Tom' } } } },
                    { PutRequest: { Item: { pk: { S: 'STUDENT#DANIELA' }, sk: { S: 'STUDENT#DANIELA' }, type: { S: 'STUDENT' }, name: { S: 'Daniela' } } } },
                    { PutRequest: { Item: { pk: { S: 'TEACHER#SIMON' }, sk: { S: 'TEACHER#SIMON' }, type: { S: 'TEACHER' }, name: { S: 'Simon' } } } },
                    { PutRequest: { Item: { pk: { S: 'SCHOOL#LAMAR' }, sk: { S: 'SCHOOL#LAMAR' }, type: { S: 'SCHOOL' }, name: { S: 'Lamar' } } } },

                    { PutRequest: { Item: { pk: { S: 'TEACHER#SIMON#CLASS#MATH' }, sk: { S: 'CLASS#MATH' }, type: { S: 'CLASS' }, subject: { S: 'Math' } } } },
                    { PutRequest: { Item: { pk: { S: 'TEACHER#SIMON#CLASS#MATH' }, sk: { S: 'STUDENT#TOM' }, type: { S: 'CLASS_STUDENT' }, subject: { S: 'Math' }, name: { S: 'Tom' }, gsipk: { S: 'STUDENT#TOM' }, gsisk: { S: 'STUDENT#TOM' } } } },
                    { PutRequest: { Item: { pk: { S: 'TEACHER#SIMON#CLASS#MATH' }, sk: { S: 'STUDENT#OSCAR' }, type: { S: 'CLASS_STUDENT' }, subject: { S: 'Math' }, name: { S: 'Oscar' }, gsipk: { S: 'STUDENT#TOM' }, gsisk: { S: 'STUDENT#TOM' } } } },
                    { PutRequest: { Item: { pk: { S: 'TEACHER#SIMON#CLASS#MATH' }, sk: { S: 'STUDENT#DANIELA' }, type: { S: 'CLASS_STUDENT' }, subject: { S: 'Math' }, name: { S: 'Daniela' }, gsipk: { S: 'STUDENT#TOM' }, gsisk: { S: 'STUDENT#TOM' } } } },

                    { PutRequest: { Item: { pk: { S: 'EXERCISE#WN16' }, sk: { S: 'EXERCISE#WN16' }, type: { S: 'EXERCISE' }, code: { S: 'WN16' }, name: { S: 'Multiplying Whole Numbers' }, s3Location: { S: 'WN16.htm' }, classification: { S: 'Miniquiz' } } } },
                    { PutRequest: { Item: { pk: { S: 'CLASS#MATH#STUDENT#TOM' }, sk: { S: 'EXERCISE#WN16' }, type: { S: 'EXERCISE_ASSIGNMENT' }, code: { S: 'WN16' }, name: { S: 'Multiplying Whole Numbers' }, isCompleted: { N: '1' }, gsipk: { S: 'EXERCISE#WN16' }, gsisk: { S: 'EXERCISE#WN16' } } } },
                    { PutRequest: { Item: { pk: { S: 'CLASS#MATH#STUDENT#OSCAR' }, sk: { S: 'EXERCISE#WN16' }, type: { S: 'EXERCISE_ASSIGNMENT' }, code: { S: 'WN16' }, name: { S: 'Multiplying Whole Numbers' }, isCompleted: { N: '0' }, gsipk: { S: 'EXERCISE#WN16' }, gsisk: { S: 'EXERCISE#WN16' } } } },
                    { PutRequest: { Item: { pk: { S: 'CLASS#MATH#STUDENT#DANIELA' }, sk: { S: 'EXERCISE#WN16' }, type: { S: 'EXERCISE_ASSIGNMENT' }, code: { S: 'WN16' }, name: { S: 'Multiplying Whole Numbers' }, isCompleted: { N: '1' }, gsipk: { S: 'EXERCISE#WN16' }, gsisk: { S: 'EXERCISE#WN16' } } } },
                    { PutRequest: { Item: { pk: { S: 'CLASS#MATH#STUDENT#TOM#EXERCISE#WN16' }, sk: { S: 'TIMESTAMP#2020-10-19T09:19:32' }, score: { N: '20' }, timestamp: { S: '2020-10-19T09:19:32' }, gsipk: { S: 'CLASS#MATH' }, gsisk: { S: 'CLASS#MATH' } } } },
                    { PutRequest: { Item: { pk: { S: 'CLASS#MATH#STUDENT#DANIELA#EXERCISE#WN16' }, sk: { S: 'TIMESTAMP#2020-10-19T11:19:32' }, score: { N: '85' }, timestamp: { S: '2020-10-19T11:19:32' }, gsipk: { S: 'CLASS#MATH' }, gsisk: { S: 'CLASS#MATH' } } } },
                ]
          },
        },
        physicalResourceId: cdk.custom_resources.PhysicalResourceId.of('initDBResource3'),
      },
      policy: cdk.custom_resources.AwsCustomResourcePolicy.fromSdkCalls({
        resources: cdk.custom_resources.AwsCustomResourcePolicy.ANY_RESOURCE,
      }),
    });
  }
}