#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { StaticHtmlHostingStack } from '../lib/static-html-hosting-stack';
import { BackendStack } from '../lib/backend-stack';

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

// Backend: Cognito (Google + custom verification), ECS on EC2, RDS Postgres
new BackendStack(app, 'ArchimedesBackendStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  description: 'Backend: Cognito, ECS on EC2, RDS Postgres',
  stage: process.env.STAGE ?? 'dev',
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
});