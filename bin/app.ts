#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { StaticHtmlHostingStack } from '../lib/static-html-hosting-stack';

const app = new cdk.App();

// Static HTML hosting for miniquizzes (paid/sensitive worksheets — uses signed URLs when key is set)
new StaticHtmlHostingStack(app, 'ArchimedesStaticHtmlStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  description: 'Static HTML hosting with S3 and CloudFront for Archimedes miniquizzes',
  signingPublicKeyPem: process.env.CLOUDFRONT_SIGNING_PUBLIC_KEY_PEM,

  // Custom domain configuration (disabled - uncomment when you have a registered domain)
  // domainName: 'your-registered-domain.com',
  // createHostedZone: false,
});