//import * as cdk from "@aws-cdk/core";
//import * as s3 from "@aws-cdk/aws-s3";
//import * as iam from "aws-iam";
import * as cdk from 'aws-cdk-lib';
import { aws_iam as iam, aws_s3 as s3, aws_s3_deployment as s3Deployment, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class ExerciseStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    // Create the public S3 bucket
    const exerciseResultsBucket = new s3.Bucket(this, 'archimedes-exercise-results-bucket', {
      bucketName: 'archimedes-exercise-results2',
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      publicReadAccess: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      websiteIndexDocument: 'index.html',
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
      'deployStaticWebsite1',
      {
        sources: [s3Deployment.Source.asset('./resources/exercise-results-default-content')],
        destinationBucket: exerciseResultsBucket,
      }
    );

    // Create the public S3 bucket
    const miniQuizzesBucket = new s3.Bucket(this, 'archimedes-mini-quizzes-bucket', {
      bucketName: 'archimedes-mini-quizzes2',
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      publicReadAccess: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      websiteIndexDocument: 'index.html',
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
      'deployStaticWebsite2',
      {
        sources: [s3Deployment.Source.asset('./resources/exercises-default-content')],
        destinationBucket: miniQuizzesBucket,
      }
    );
  }
}