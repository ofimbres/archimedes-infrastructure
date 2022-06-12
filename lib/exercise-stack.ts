//import * as cdk from "@aws-cdk/core";
//import * as s3 from "@aws-cdk/aws-s3";
//import * as iam from "aws-iam";
import * as cdk from 'aws-cdk-lib';
import { aws_iam as iam, aws_s3 as s3, Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'

export class ExerciseStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    // The code that defines your stack goes here
    const exerciseResultsBucket = new s3.Bucket(this, 'archimedes-exercise-results-bucket', {
      bucketName: 'archimedes-exercise-results2',
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      versioned: true,
      publicReadAccess: false,
      encryption: s3.BucketEncryption.S3_MANAGED,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'error.html',
      lifecycleRules: [
        {
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(90),
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

    //s3Bucket.grantRead(new iam.AccountRootPrincipal());
    /*exerciseResultsBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ["s3:*"],
        effect: iam.Effect.ALLOW,
        principals: [new iam.AnyPrincipal()],
        resources: [exerciseResultsBucket.bucketArn, exerciseResultsBucket.bucketArn + "/*"]
      })
    );*/

    // accessControl: BucketAccessControl.PUBLIC_READ
    // The code that defines your stack goes here
    const miniQuizzesStaticBucket = new s3.Bucket(this, 'archimedes-mini-quizzes-static-bucket', {
      bucketName: 'archimedes-mini-quizzes-static',
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      publicReadAccess: false,
      encryption: s3.BucketEncryption.S3_MANAGED,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'error.html'
    });

    //s3Bucket2.grantRead(new iam.AccountRootPrincipal());
    /*s3Bucket2.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ["s3:*"],
        effect: iam.Effect.ALLOW,
        principals: [new iam.AnyPrincipal()],
        resources: [s3Bucket2.bucketArn, s3Bucket2.bucketArn + "/*"],
        conditions: {
          Bool: {
            "aws:SecureTransport": "true",
          },
        },
      })
    );*/
  }
}