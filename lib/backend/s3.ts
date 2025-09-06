import * as cdk from 'aws-cdk-lib';
import { aws_iam as iam, aws_s3 as s3,
         aws_s3_deployment as s3_deployment } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class S3 extends Construct {
    constructor(scope: Construct, id: string, stage: string) {
      super(scope, id);

    const exerciseresults_bucket = new s3.Bucket(this, 'exercise-results-bucket', {
        bucketName: `${stage}-archmimedes-exercise-results-bucket`,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
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
  
      const exercises_bucket = new s3.Bucket(this, 'exercises-bucket', {
        bucketName: `${stage}-archimedes-exercises-bucket`,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
        encryption: s3.BucketEncryption.S3_MANAGED,
        publicReadAccess: true,
        blockPublicAccess: {
          blockPublicAcls: false,
          blockPublicPolicy: false,
          ignorePublicAcls: false,
          restrictPublicBuckets: false,
        },
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
  }
}