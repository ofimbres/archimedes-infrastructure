import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { Construct } from 'constructs';

export interface FrontendStackProps extends cdk.StackProps {
  /**
   * Stage name (e.g. dev, prod). Used for resource naming.
   */
  stage?: string;
}

/**
 * Frontend stack: S3 + CloudFront for the app UI (HTML, JS, CSS).
 * Frontend calls the backend ALB directly; backend must allow CORS from this origin.
 * Cognito callback/logout URLs should include the CloudFront URL (via BackendStack additionalCallbackUrls).
 */
export class FrontendStack extends cdk.Stack {
  public readonly bucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props?: FrontendStackProps) {
    super(scope, id, props);

    const stage = props?.stage ?? 'dev';

    // S3 bucket for frontend assets (private, CloudFront only)
    this.bucket = new s3.Bucket(this, 'FrontendBucket', {
      bucketName: `archimedes-frontend-${stage}-${this.account}-${this.region}`.toLowerCase().replace(/[^a-z0-9-]/g, ''),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    const originAccessControl = new cloudfront.S3OriginAccessControl(this, 'OAC', {
      description: 'OAC for app frontend',
    });

    this.distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(this.bucket, {
          originAccessControl,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        compress: true,
      },
      errorResponses: [
        { httpStatus: 403, responseHttpStatus: 200, responsePagePath: '/index.html', ttl: cdk.Duration.seconds(0) },
        { httpStatus: 404, responseHttpStatus: 200, responsePagePath: '/index.html', ttl: cdk.Duration.seconds(0) },
      ],
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      comment: 'Archimedes app frontend',
    });

    new cdk.CfnOutput(this, 'FrontendUrl', {
      value: `https://${this.distribution.distributionDomainName}`,
      description: 'Frontend CloudFront URL (use in Cognito callback/logout URLs and for CORS)',
    });
    new cdk.CfnOutput(this, 'FrontendBucketName', {
      value: this.bucket.bucketName,
      description: 'S3 bucket for frontend assets (deploy with aws s3 sync or CI)',
    });
    new cdk.CfnOutput(this, 'DistributionId', {
      value: this.distribution.distributionId,
      description: 'CloudFront distribution ID (e.g. for cache invalidation)',
    });
  }
}
