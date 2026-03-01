import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import { Construct } from 'constructs';

export interface StaticHtmlHostingStackProps extends cdk.StackProps {
  domainName?: string;
  createHostedZone?: boolean;
}

export class StaticHtmlHostingStack extends cdk.Stack {
  public readonly bucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;
  public readonly domainName: string;
  public readonly hostedZone?: route53.HostedZone;
  public readonly certificate?: acm.Certificate;

  constructor(scope: Construct, id: string, props?: StaticHtmlHostingStackProps) {
    super(scope, id, props);

    const customDomainName = props?.domainName;
    const createHostedZone = props?.createHostedZone;

    // Create hosted zone if requested
    if (customDomainName && createHostedZone) {
      this.hostedZone = new route53.HostedZone(this, 'HostedZone', {
        zoneName: customDomainName,
      });
    }

    // Create SSL certificate for custom domain
    if (customDomainName) {
      this.certificate = new acm.Certificate(this, 'Certificate', {
        domainName: customDomainName,
        validation: acm.CertificateValidation.fromDns(this.hostedZone),
      });
    }

    // S3 Bucket for miniquizzes
    this.bucket = new s3.Bucket(this, 'MiniquizzesBucket', {
      bucketName: `archimedes-miniquizzes-${this.account}-${this.region}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development - change for production
      autoDeleteObjects: true, // For development - change for production
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    // CloudFront Origin Access Control
    const originAccessControl = new cloudfront.S3OriginAccessControl(this, 'OAC', {
      description: 'OAC for miniquizzes',
    });

    // CloudFront Distribution
    this.distribution = new cloudfront.Distribution(this, 'MiniquizzesDistribution', {
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(this.bucket, {
          originAccessControl,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        compress: true,
      },
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      comment: 'Archimedes Miniquizzes Distribution',
      domainNames: customDomainName ? [customDomainName] : undefined,
      certificate: this.certificate,
    });

    // Create DNS record if using custom domain
    if (customDomainName && this.hostedZone) {
      new route53.ARecord(this, 'DomainRecord', {
        zone: this.hostedZone,
        target: route53.RecordTarget.fromAlias(
          new route53Targets.CloudFrontTarget(this.distribution)
        ),
      });
    }

    // Store the domain name
    this.domainName = customDomainName || this.distribution.distributionDomainName;

    // Outputs
    new cdk.CfnOutput(this, 'WebsiteUrl', {
      value: `https://${this.domainName}`,
      description: 'Website URL',
    });

    new cdk.CfnOutput(this, 'CloudFrontUrl', {
      value: `https://${this.distribution.distributionDomainName}`,
      description: 'CloudFront Distribution URL for miniquizzes',
    });

    // Output the S3 bucket name
    new cdk.CfnOutput(this, 'S3BucketName', {
      value: this.bucket.bucketName,
      description: 'S3 Bucket name for miniquizzes',
    });

    // Output hosted zone info if created
    if (this.hostedZone) {
      new cdk.CfnOutput(this, 'NameServers', {
        value: cdk.Fn.join(', ', this.hostedZone.hostedZoneNameServers || []),
        description: 'Name servers to configure with your domain registrar',
      });
    }
  }
}