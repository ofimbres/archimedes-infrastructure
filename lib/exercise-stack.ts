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
      'deployDefaultObjects1',
      {
        sources: [s3Deployment.Source.asset('./resources/exercise-results-default-content')],
        destinationBucket: exerciseResultsBucket,
        destinationKeyPrefix: 'mini-quiz',
      }
    );

    // Create the public S3 bucket
    const miniQuizzesBucket = new s3.Bucket(this, 'archimedes-exercises-bucket', {
      bucketName: 'archimedes-exercises',
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
        destinationKeyPrefix: 'mini-quiz',
      }
    );

    const dataTable = new dynamodb.Table(this, 'archimedes-data-table', {
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

    // add global secondary index
    dataTable.addGlobalSecondaryIndex({
      indexName: 'gsi1',
      partitionKey: { name: 'gsipk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'gsisk', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    new cdk.custom_resources.AwsCustomResource(this, 'initDBResource', {
      onCreate: {
        service: 'DynamoDB',
        action: 'batchWriteItem',
        parameters: {
          RequestItems: {
            ['ArchimedesData']:
                [
                    { PutRequest: { Item: { pk: { S: 'STUDENT#3c44e80d-d9ac-4c1c-a3fa-e38317f50011' }, sk: { S: 'STUDENT#3c44e80d-d9ac-4c1c-a3fa-e38317f50011' }, type: { S: 'STUDENT' }, firstName: { S: 'Oscar' }, lastName: { S: 'Fimbres' }, email: { S: 'oscar.fimbres@gmail.com' } } } },
                    { PutRequest: { Item: { pk: { S: 'STUDENT#ed52a8f0-cc9a-4ad5-845d-a68c8e5f4892' }, sk: { S: 'STUDENT#ed52a8f0-cc9a-4ad5-845d-a68c8e5f4892' }, type: { S: 'STUDENT' }, firstName: { S: 'Tom' }, lastName: { S: 'Riddle' }, email: { S: 'tom.riddle@gmail.com' } } } },
                    { PutRequest: { Item: { pk: { S: 'STUDENT#16359b1b-43e5-4d21-8cca-bda6c4978f7e' }, sk: { S: 'STUDENT#16359b1b-43e5-4d21-8cca-bda6c4978f7e' }, type: { S: 'STUDENT' }, firstName: { S: 'Daniela' }, lastName: { S: 'Collins' }, email: { S: 'daniela.collins@gmail.com' } } } },
                    { PutRequest: { Item: { pk: { S: 'TEACHER#c2eb3f7b-bb91-469c-86a6-d84881a228e0' }, sk: { S: 'TEACHER#c2eb3f7b-bb91-469c-86a6-d84881a228e0' }, type: { S: 'TEACHER' }, firstName: { S: 'Simon' }, lastName: { S: 'Finnegan' }, email: { S: 'simon.finnegan@lamar.com' } } } },
                    { PutRequest: { Item: { pk: { S: 'SCHOOL#44634776-1715-4292-9259-7ea3dd703268' },  sk: { S: 'SCHOOL#44634776-1715-4292-9259-7ea3dd703268' },  type: { S: 'SCHOOL' }, name: { S: 'Lamar' } } } },
                    { PutRequest: { Item: { pk: { S: 'CLASS#e46e7191-e31d-434a-aba3-b9a9c187a632' },   sk: { S: 'CLASS#e46e7191-e31d-434a-aba3-b9a9c187a632' },   type: { S: 'CLASS' }, subject: { S: 'Math' } } } },

                    { PutRequest: { Item: { pk: { S: 'TEACHER#c2eb3f7b-bb91-469c-86a6-d84881a228e0#CLASS#e46e7191-e31d-434a-aba3-b9a9c187a632' }, sk: { S: 'STUDENT#3c44e80d-d9ac-4c1c-a3fa-e38317f50011' }, type: { S: 'CLASS_STUDENT' }, subject: { S: 'Math' }, firstName: { S: 'Oscar' }, gsipk: { S: 'STUDENT#3c44e80d-d9ac-4c1c-a3fa-e38317f50011' }, gsisk: { S: 'STUDENT#3c44e80d-d9ac-4c1c-a3fa-e38317f50011' } } } },
                    { PutRequest: { Item: { pk: { S: 'TEACHER#c2eb3f7b-bb91-469c-86a6-d84881a228e0#CLASS#e46e7191-e31d-434a-aba3-b9a9c187a632' }, sk: { S: 'STUDENT#ed52a8f0-cc9a-4ad5-845d-a68c8e5f4892' }, type: { S: 'CLASS_STUDENT' }, subject: { S: 'Math' }, firstName: { S: 'Tom' }, gsipk: { S: 'STUDENT#ed52a8f0-cc9a-4ad5-845d-a68c8e5f4892' }, gsisk: { S: 'STUDENT#ed52a8f0-cc9a-4ad5-845d-a68c8e5f4892' } } } },
                    { PutRequest: { Item: { pk: { S: 'TEACHER#c2eb3f7b-bb91-469c-86a6-d84881a228e0#CLASS#e46e7191-e31d-434a-aba3-b9a9c187a632' }, sk: { S: 'STUDENT#16359b1b-43e5-4d21-8cca-bda6c4978f7e' }, type: { S: 'CLASS_STUDENT' }, subject: { S: 'Math' }, firstName: { S: 'Daniela' }, gsipk: { S: 'STUDENT#16359b1b-43e5-4d21-8cca-bda6c4978f7e' }, gsisk: { S: 'STUDENT#16359b1b-43e5-4d21-8cca-bda6c4978f7e' } } } },

                    { PutRequest: { Item: { pk: { S: 'EXERCISE#WN16' }, sk: { S: 'EXERCISE#WN16' }, type: { S: 'EXERCISE' }, code: { S: 'WN16' }, name: { S: 'Multiplying Whole Numbers' }, s3Location: { S: 'mini-quiz/WN16.htm' }, classification: { S: 'Miniquiz' } } } },
                    { PutRequest: { Item: { pk: { S: 'CLASS#e46e7191-e31d-434a-aba3-b9a9c187a632#STUDENT#3c44e80d-d9ac-4c1c-a3fa-e38317f50011' }, sk: { S: 'EXERCISE#WN16' }, type: { S: 'EXERCISE_ASSIGNMENT' }, code: { S: 'WN16' }, name: { S: 'Multiplying Whole Numbers' }, isCompleted: { N: '0' }, gsipk: { S: 'EXERCISE#WN16' }, gsisk: { S: 'EXERCISE#WN16' } } } },
                    { PutRequest: { Item: { pk: { S: 'CLASS#e46e7191-e31d-434a-aba3-b9a9c187a632#STUDENT#ed52a8f0-cc9a-4ad5-845d-a68c8e5f4892' }, sk: { S: 'EXERCISE#WN16' }, type: { S: 'EXERCISE_ASSIGNMENT' }, code: { S: 'WN16' }, name: { S: 'Multiplying Whole Numbers' }, isCompleted: { N: '1' }, gsipk: { S: 'EXERCISE#WN16' }, gsisk: { S: 'EXERCISE#WN16' } } } },
                    { PutRequest: { Item: { pk: { S: 'CLASS#e46e7191-e31d-434a-aba3-b9a9c187a632#STUDENT#16359b1b-43e5-4d21-8cca-bda6c4978f7e' }, sk: { S: 'EXERCISE#WN16' }, type: { S: 'EXERCISE_ASSIGNMENT' }, code: { S: 'WN16' }, name: { S: 'Multiplying Whole Numbers' }, isCompleted: { N: '1' }, gsipk: { S: 'EXERCISE#WN16' }, gsisk: { S: 'EXERCISE#WN16' } } } },
                    { PutRequest: { Item: { pk: { S: 'CLASS#e46e7191-e31d-434a-aba3-b9a9c187a632#STUDENT#ed52a8f0-cc9a-4ad5-845d-a68c8e5f4892#EXERCISE#WN16' }, sk: { S: 'TIMESTAMP#2020-10-19T09:19:32Z' }, type: { S: 'SCORE' }, score: { N: '20' }, timestamp: { S: '2020-10-19T09:19:32Z' }, firstName: { S: 'Tom' }, lastName: { S: 'Riddle' }, gsipk: { S: 'CLASS#e46e7191-e31d-434a-aba3-b9a9c187a632' }, gsisk: { S: 'CLASS#e46e7191-e31d-434a-aba3-b9a9c187a632' } } } },
                    { PutRequest: { Item: { pk: { S: 'CLASS#e46e7191-e31d-434a-aba3-b9a9c187a632#STUDENT#16359b1b-43e5-4d21-8cca-bda6c4978f7e#EXERCISE#WN16' }, sk: { S: 'TIMESTAMP#2020-10-19T11:19:32Z' }, type: { S: 'SCORE' }, score: { N: '85' }, timestamp: { S: '2020-10-19T11:19:32Z' }, firstName: { S: 'Daniela' }, lastName: { S: 'Collins' }, gsipk: { S: 'CLASS#e46e7191-e31d-434a-aba3-b9a9c187a632' }, gsisk: { S: 'CLASS#e46e7191-e31d-434a-aba3-b9a9c187a632' } } } },
                ]
          },
        },
        physicalResourceId: cdk.custom_resources.PhysicalResourceId.of('initDBResource'),
      },
      policy: cdk.custom_resources.AwsCustomResourcePolicy.fromSdkCalls({
        resources: cdk.custom_resources.AwsCustomResourcePolicy.ANY_RESOURCE,
      }),
    });
  }
}