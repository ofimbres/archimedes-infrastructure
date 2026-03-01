#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { StaticHtmlHostingStack } from '../lib/static-html-hosting-stack';

const app = new cdk.App();

// Static HTML hosting for miniquizzes and other content
new StaticHtmlHostingStack(app, 'ArchimedesStaticHtmlStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  description: 'Static HTML hosting with S3 and CloudFront for Archimedes miniquizzes',
  
  // Custom domain configuration (disabled - uncomment when you have a registered domain)
  // domainName: 'your-registered-domain.com',
  // createHostedZone: false,
});