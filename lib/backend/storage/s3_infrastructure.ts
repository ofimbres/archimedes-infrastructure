import * as cdk from 'aws-cdk-lib';
import { aws_iam as iam, aws_s3 as s3,
         aws_s3_deployment as s3_deployment } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class Storage extends Construct {
    constructor(scope: Construct, id: string) {
      super(scope, id);

    // Create the public S3 bucket
    const exerciseresults_bucket = new s3.Bucket(this, 'archimedes-exercise-results-bucket', {
        bucketName: 'archimedes-exercise-results',
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
  
      // Create the public S3 bucket
      const miniquizzes_bucket = new s3.Bucket(this, 'archimedes-exercises-bucket', {
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
      new s3_deployment.BucketDeployment(
        this,
        'deployMiniQuizzFiles',
        {
          sources: [s3_deployment.Source.asset('./assets/mini-quizzes')],
          destinationKeyPrefix: 'mini-quiz',
          destinationBucket: miniquizzes_bucket,
          memoryLimit: 512
        }
      );
  }
}