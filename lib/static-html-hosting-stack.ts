import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface StaticHtmlHostingStackProps extends cdk.StackProps {
  domainName?: string;
  createHostedZone?: boolean;
  /**
   * PEM-encoded RSA public key for CloudFront signed URLs (paid/sensitive content).
   * When set, distribution requires signed URLs; backend uses the private key to sign.
   * Get from env or context, e.g. process.env.CLOUDFRONT_SIGNING_PUBLIC_KEY
   */
  signingPublicKeyPem?: string;
}

export class StaticHtmlHostingStack extends cdk.Stack {
  public readonly bucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;
  public readonly domainName: string;
  public readonly hostedZone?: route53.HostedZone;
  public readonly certificate?: acm.Certificate;
  /** Key Pair ID for signed URLs (when signingPublicKeyPem is set). Backend needs this to sign. */
  public readonly signingKeyPairId?: string;
  /** Secrets Manager secret for the signing private key (when signed URLs enabled). Replace placeholder with your PEM. */
  public readonly signingPrivateKeySecret?: secretsmanager.ISecret;

  constructor(scope: Construct, id: string, props?: StaticHtmlHostingStackProps) {
    super(scope, id, props);

    const customDomainName = props?.domainName;
    const createHostedZone = props?.createHostedZone;
    const signingPublicKeyPem = props?.signingPublicKeyPem;

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

    // Secret for the signing private key — always created so you can set the value before enabling signed URLs (see docs/SIGNED_URLS_SETUP.md)
    this.signingPrivateKeySecret = new secretsmanager.Secret(this, 'SigningPrivateKeySecret', {
      secretName: `archimedes/cloudfront-signing-private-key`,
      description: 'CloudFront signing private key PEM for miniquiz signed URLs. Replace the value with your private key (see docs/SIGNED_URLS_SETUP.md).',
      secretStringValue: cdk.SecretValue.unsafePlainText(
        'REPLACE_IN_AWS_CONSOLE: Paste your CloudFront signing private key PEM here (see docs/SIGNED_URLS_SETUP.md)'
      ),
    });

    // Signed URLs: when public key is provided, only signed URLs can access content (for paid/sensitive worksheets)
    let keyGroup: cloudfront.KeyGroup | undefined;
    if (signingPublicKeyPem) {
      const publicKey = new cloudfront.PublicKey(this, 'SigningKey', {
        encodedKey: signingPublicKeyPem,
        comment: 'Public key for miniquiz signed URLs',
      });
      this.signingKeyPairId = publicKey.publicKeyId;
      keyGroup = new cloudfront.KeyGroup(this, 'SigningKeyGroup', {
        items: [publicKey],
        comment: 'Key group for miniquiz signed URLs',
      });
    }

    // CloudFront Distribution
    this.distribution = new cloudfront.Distribution(this, 'MiniquizzesDistribution', {
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(this.bucket, {
          originAccessControl,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.ALLOW_ALL,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        compress: true,
        ...(keyGroup && { trustedKeyGroups: [keyGroup] }),
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

    new cdk.CfnOutput(this, 'DistributionId', {
      value: this.distribution.distributionId,
      description: 'CloudFront Distribution ID (for cache invalidation)',
    });

    // Output the S3 bucket name
    new cdk.CfnOutput(this, 'S3BucketName', {
      value: this.bucket.bucketName,
      description: 'S3 Bucket name for miniquizzes',
    });

    if (this.signingKeyPairId) {
      new cdk.CfnOutput(this, 'SigningKeyPairId', {
        value: this.signingKeyPairId,
        description: 'CloudFront Key Pair ID for signed URLs (use in backend with private key)',
      });
    }

    if (this.signingPrivateKeySecret) {
      new cdk.CfnOutput(this, 'SigningPrivateKeySecretArn', {
        value: this.signingPrivateKeySecret.secretArn,
        description: 'Secrets Manager ARN for signing private key — set CLOUDFRONT_SIGNING_PRIVATE_KEY_SECRET_ID to this in backend',
      });
    }

    // Output hosted zone info if created
    if (this.hostedZone) {
      new cdk.CfnOutput(this, 'NameServers', {
        value: cdk.Fn.join(', ', this.hostedZone.hostedZoneNameServers || []),
        description: 'Name servers to configure with your domain registrar',
      });
    }
  }
}