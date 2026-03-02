#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { StaticHtmlHostingStack } from '../lib/static-html-hosting-stack';
import { FrontendStack } from '../lib/frontend-stack';
import { BackendStack } from '../lib/backend-stack';

const app = new cdk.App();

const env = { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION };
const stage = process.env.STAGE ?? 'dev';

// Static HTML hosting for miniquizzes (paid/sensitive worksheets — uses signed URLs when key is set)
new StaticHtmlHostingStack(app, 'ArchimedesStaticHtmlStack', {
  env,
  description: 'Static HTML hosting with S3 and CloudFront for Archimedes miniquizzes',
  signingPublicKeyPem: process.env.CLOUDFRONT_SIGNING_PUBLIC_KEY_PEM,

  // Custom domain configuration (disabled - uncomment when you have a registered domain)
  // domainName: 'your-registered-domain.com',
  // createHostedZone: false,
});

// App frontend: S3 + CloudFront (frontend calls backend ALB directly; backend must allow CORS)
const frontendStack = new FrontendStack(app, 'ArchimedesFrontendStack', {
  env,
  description: 'App frontend: S3 + CloudFront for HTML/JS/CSS',
  stage,
});

const frontendUrl = `https://${frontendStack.distribution.distributionDomainName}`;

// Backend: Cognito (Google + custom verification), ECS on EC2, RDS Postgres. Cognito callbacks include frontend URL.
const backendStack = new BackendStack(app, 'ArchimedesBackendStack', {
  env,
  description: 'Backend: Cognito, ECS on EC2, RDS Postgres',
  stage,
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  additionalCallbackUrls: [`${frontendUrl}/callback`, frontendUrl],
  additionalLogoutUrls: [frontendUrl],
});
backendStack.addDependency(frontendStack);