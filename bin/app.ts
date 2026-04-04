#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { StaticHtmlHostingStack } from '../lib/static-html-hosting-stack';
import { FrontendStack } from '../lib/frontend-stack';
import { BackendStack } from '../lib/backend-stack';
import { BackendPipelineStack } from '../lib/backend-pipeline-stack';
import { GithubActionsBackendCicdStack } from '../lib/github-actions-backend-cicd-stack';

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

type BackendEcsContext = {
  useNginxPlaceholder?: boolean;
  backendContainerPort?: number;
  backendHealthCheckPath?: string;
};

function parseBackendEcsContext(raw: unknown): BackendEcsContext | undefined {
  if (raw == null || raw === '') {
    return undefined;
  }
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as BackendEcsContext;
    } catch {
      return undefined;
    }
  }
  return raw as BackendEcsContext;
}

const backendEcsCtx = parseBackendEcsContext(app.node.tryGetContext('backendEcs'));

type BackendBastionContext = {
  /** t4g.nano SSM jump host; RDS allows 5432 from it. Set false and redeploy to remove. */
  enabled?: boolean;
};

function parseBackendBastionContext(raw: unknown): BackendBastionContext | undefined {
  if (raw == null || raw === '') {
    return undefined;
  }
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as BackendBastionContext;
    } catch {
      return undefined;
    }
  }
  return raw as BackendBastionContext;
}

const backendBastionCtx = parseBackendBastionContext(app.node.tryGetContext('backendBastion'));

// Backend: Cognito (Google + custom verification), ECS on EC2, RDS Postgres. Cognito callbacks include frontend URL.
const backendStack = new BackendStack(app, 'ArchimedesBackendStack', {
  env,
  description: 'Backend: Cognito, ECS on EC2, RDS Postgres',
  stage,
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  additionalCallbackUrls: [`${frontendUrl}/callback`, frontendUrl],
  additionalLogoutUrls: [frontendUrl],
  useNginxPlaceholder: backendEcsCtx?.useNginxPlaceholder,
  backendContainerPort: backendEcsCtx?.backendContainerPort,
  backendHealthCheckPath: backendEcsCtx?.backendHealthCheckPath,
  enableSsmBastion: backendBastionCtx?.enabled === true,
});
backendStack.addDependency(frontendStack);

type GithubActionsCicdContext = {
  enabled?: boolean;
  githubOrg?: string;
  githubRepo?: string;
  githubBranch?: string;
  /** Overrides default IAM `sub` StringLike: `repo:{githubOrg}/{githubRepo}:*` */
  oidcSubjectPattern?: string;
  existingGitHubOidcProviderArn?: string;
};

function parseGithubActionsCicdContext(raw: unknown): GithubActionsCicdContext | undefined {
  if (raw == null || raw === '') {
    return undefined;
  }
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as GithubActionsCicdContext;
    } catch {
      return undefined;
    }
  }
  return raw as GithubActionsCicdContext;
}

const githubActionsCicdCtx = parseGithubActionsCicdContext(app.node.tryGetContext('githubActionsCicd'));
const enableGithubActionsCicd =
  githubActionsCicdCtx != null &&
  githubActionsCicdCtx.enabled !== false &&
  !!githubActionsCicdCtx.githubOrg &&
  !!githubActionsCicdCtx.githubRepo;

if (enableGithubActionsCicd) {
  new GithubActionsBackendCicdStack(app, 'ArchimedesGithubActionsBackendCicdStack', {
    env,
    description: 'GitHub Actions OIDC role for backend ECR/ECS deploy',
    stage,
    githubOrg: githubActionsCicdCtx!.githubOrg!,
    githubRepo: githubActionsCicdCtx!.githubRepo!,
    githubBranch: githubActionsCicdCtx!.githubBranch,
    oidcSubjectPattern: githubActionsCicdCtx!.oidcSubjectPattern,
    existingGitHubOidcProviderArn: githubActionsCicdCtx!.existingGitHubOidcProviderArn,
    ecrRepository: backendStack.backendRepository,
    cluster: backendStack.cluster,
    backendService: backendStack.backendService,
    backendTaskDefinition: backendStack.backendTaskDefinition,
  }).addDependency(backendStack);
}


type BackendPipelineContext = {
  connectionArn?: string;
  githubOwner?: string;
  githubRepo?: string;
  githubBranch?: string;
  useCodeCommit?: boolean;
  requireManualApproval?: boolean;
};

function parseBackendPipelineContext(raw: unknown): BackendPipelineContext | undefined {
  if (raw == null || raw === '') {
    return undefined;
  }
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as BackendPipelineContext;
    } catch {
      return undefined;
    }
  }
  return raw as BackendPipelineContext;
}

const backendPipelineRaw = parseBackendPipelineContext(app.node.tryGetContext('backendPipeline'));
const backendPipelineCtx: BackendPipelineContext | undefined = backendPipelineRaw
  ? {
      ...backendPipelineRaw,
      connectionArn: backendPipelineRaw.connectionArn ?? process.env.CODESTAR_CONNECTION_ARN,
    }
  : process.env.CODESTAR_CONNECTION_ARN
    ? { connectionArn: process.env.CODESTAR_CONNECTION_ARN }
    : undefined;

const enableBackendPipeline =
  backendPipelineCtx?.useCodeCommit === true ||
  (!!backendPipelineCtx?.githubOwner &&
    !!backendPipelineCtx?.githubRepo &&
    (backendPipelineCtx.useCodeCommit ?? false) === false);

if (enableBackendPipeline) {
  new BackendPipelineStack(app, 'ArchimedesBackendPipelineStack', {
    env,
    description: 'Backend CI/CD: CodeBuild, ECR, ECS deploy',
    stage,
    backendService: backendStack.backendService,
    ecrRepository: backendStack.backendRepository,
    codeStarConnectionArn: backendPipelineCtx?.connectionArn,
    githubOwner: backendPipelineCtx?.githubOwner,
    githubRepo: backendPipelineCtx?.githubRepo,
    githubBranch: backendPipelineCtx?.githubBranch,
    useCodeCommit: backendPipelineCtx?.useCodeCommit ?? false,
    requireManualApprovalBeforeDeploy: backendPipelineCtx?.requireManualApproval ?? false,
  }).addDependency(backendStack);
}

