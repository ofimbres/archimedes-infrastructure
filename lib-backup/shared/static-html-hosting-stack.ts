import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';

export interface StaticHtmlHostingProps extends cdk.StackProps {
  /**
   * Custom domain name (optional)
   * If provided, you'll need to manually configure DNS in Route 53
   */
  domainName?: string;
  
  /**
   * Enable signed URLs for authentication (default: false)
   * When true, access to files will require signed URLs
   */
  enableSignedUrls?: boolean;
  
  /**
   * Signed URL expiration time in seconds (default: 3600 = 1 hour)
   */
  signedUrlTtl?: number;
}

export class StaticHtmlHostingStack extends cdk.Stack {
  public readonly bucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;
  public readonly distributionDomainName: string;

  constructor(scope: Construct, id: string, props: StaticHtmlHostingProps = {}) {
    super(scope, id, props);

    const {
      enableSignedUrls = false,
      signedUrlTtl = 3600,
      domainName
    } = props;

    // S3 Bucket for static content
    this.bucket = new s3.Bucket(this, 'StaticHtmlBucket', {
      bucketName: `static-html-${this.account}-${this.region}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // CAUTION: Change for production
      autoDeleteObjects: true, // CAUTION: Change for production
      publicReadAccess: false, // Security: No direct public access
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioning: false, // Keep costs low
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          enabled: true,
          abortIncompleteMultipartUploadsAfter: cdk.Duration.days(7),
        }
      ],
    });

    // Origin Access Control (OAC) - More secure than OAI
    const originAccessControl = new cloudfront.OriginAccessControl(this, 'OAC', {
      description: 'OAC for static HTML hosting',
      originAccessControlOriginType: cloudfront.OriginAccessControlOriginType.S3,
      signing: cloudfront.Signing.SIGV4_ALWAYS,
    });

    // CloudFront key group for signed URLs (optional)
    let keyGroup: cloudfront.KeyGroup | undefined;
    if (enableSignedUrls) {
      // You'll need to create this key pair manually in AWS Console or via CLI
      const publicKey = new cloudfront.PublicKey(this, 'SigningKey', {
        encodedKey: 'REPLACE_WITH_YOUR_PUBLIC_KEY', // You'll need to replace this
        comment: 'Public key for signed URLs',
      });

      keyGroup = new cloudfront.KeyGroup(this, 'KeyGroup', {
        items: [publicKey],
        comment: 'Key group for signed URLs',
      });
    }

    // CloudFront Distribution
    this.distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(this.bucket, {
          originAccessControl,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        compress: true,
        trustedKeyGroups: enableSignedUrls && keyGroup ? [keyGroup] : undefined,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
      ],
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100, // Use only US, Canada and Europe for cost optimization
      comment: 'Static HTML hosting distribution',
      domainNames: domainName ? [domainName] : undefined,
    });

    this.distributionDomainName = this.distribution.distributionDomainName;

    // Grant CloudFront OAC access to S3 bucket
    this.bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('cloudfront.amazonaws.com')],
        actions: ['s3:GetObject'],
        resources: [this.bucket.arnForObjects('*')],
        conditions: {
          StringEquals: {
            'AWS:SourceArn': `arn:aws:cloudfront::${this.account}:distribution/${this.distribution.distributionId}`,
          },
        },
      })
    );

    // Deploy static files (optional - remove if you want to upload manually)
    const deployment = new s3deploy.BucketDeployment(this, 'DeployStaticFiles', {
      sources: [s3deploy.Source.asset('../scripts/extracted/miniquizzes')], // Path to your HTML files
      destinationBucket: this.bucket,
      distribution: this.distribution,
      distributionPaths: ['/*'],
    });

    // Outputs
    new cdk.CfnOutput(this, 'BucketName', {
      value: this.bucket.bucketName,
      description: 'Name of the S3 bucket',
    });

    new cdk.CfnOutput(this, 'DistributionId', {
      value: this.distribution.distributionId,
      description: 'CloudFront Distribution ID',
    });

    new cdk.CfnOutput(this, 'DistributionDomainName', {
      value: this.distributionDomainName,
      description: 'CloudFront Distribution Domain Name',
    });

    new cdk.CfnOutput(this, 'WebsiteURL', {
      value: `https://${this.distributionDomainName}`,
      description: 'Website URL',
    });

    if (enableSignedUrls) {
      new cdk.CfnOutput(this, 'SignedUrlTTL', {
        value: signedUrlTtl.toString(),
        description: 'Signed URL TTL in seconds',
      });
    }
  }
}