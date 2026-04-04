import * as cdk from 'aws-cdk-lib';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface GithubActionsBackendCicdStackProps extends cdk.StackProps {
  stage?: string;
  /** GitHub org or user (e.g. ofimbres). */
  githubOrg: string;
  /** Repository name only (e.g. archimedes-backend). */
  githubRepo: string;
  /**
   * Optional; informational (e.g. docs). Trust defaults to `repo:{org}/{repo}:*` so push, PR, and manual runs work.
   */
  githubBranch?: string;
  /**
   * StringLike pattern for `token.actions.githubusercontent.com:sub`.
   * @default repo:{githubOrg}/{githubRepo}:*
   */
  oidcSubjectPattern?: string;
  /**
   * If your account already has `token.actions.githubusercontent.com` OIDC provider, pass its ARN
   * to avoid CloudFormation duplicate-provider errors.
   */
  existingGitHubOidcProviderArn?: string;
  ecrRepository: ecr.IRepository;
  cluster: ecs.ICluster;
  backendService: ecs.IBaseService;
  backendTaskDefinition: ecs.TaskDefinition;
}

/**
 * GitHub Actions OIDC: IAM role for pushing to ECR and updating ECS (no long-lived AWS keys in GitHub).
 * Separate from BackendStack so runtime and CI identity stay isolated.
 */
export class GithubActionsBackendCicdStack extends cdk.Stack {
  public readonly deployRole: iam.Role;
  public readonly gitHubOidcProvider: iam.IOpenIdConnectProvider;

  constructor(scope: Construct, id: string, props: GithubActionsBackendCicdStackProps) {
    super(scope, id, props);

    const stage = props.stage ?? 'dev';
    const subPattern =
      props.oidcSubjectPattern ?? `repo:${props.githubOrg}/${props.githubRepo}:*`;

    if (props.existingGitHubOidcProviderArn) {
      this.gitHubOidcProvider = iam.OpenIdConnectProvider.fromOpenIdConnectProviderArn(
        this,
        'GitHubOidcImported',
        props.existingGitHubOidcProviderArn,
      );
    } else {
      this.gitHubOidcProvider = new iam.OpenIdConnectProvider(this, 'GitHubOidc', {
        url: 'https://token.actions.githubusercontent.com',
        clientIds: ['sts.amazonaws.com'],
      });
    }

    this.deployRole = new iam.Role(this, 'GitHubActionsDeployRole', {
      roleName: `${stage}-github-actions-backend-deploy`,
      assumedBy: new iam.WebIdentityPrincipal(this.gitHubOidcProvider.openIdConnectProviderArn, {
        StringEquals: {
          'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
        },
        StringLike: {
          'token.actions.githubusercontent.com:sub': subPattern,
        },
      }),
      description: `GitHub Actions OIDC: ${props.githubOrg}/${props.githubRepo} (sub ~ ${subPattern})`,
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryPowerUser'),
      ],
    });

    // ECS deploy / new task definition with new image (typical GH Actions flow)
    this.deployRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'ecs:UpdateService',
          'ecs:DescribeServices',
          'ecs:DescribeClusters',
          'ecs:DescribeTaskDefinition',
          'ecs:RegisterTaskDefinition',
          'ecs:ListTaskDefinitions',
        ],
        resources: ['*'],
      }),
    );

    const exec = props.backendTaskDefinition.executionRole;
    const task = props.backendTaskDefinition.taskRole;
    if (exec) {
      exec.grantPassRole(this.deployRole);
    }
    if (task) {
      task.grantPassRole(this.deployRole);
    }

    new cdk.CfnOutput(this, 'BackendEcrRepositoryUri', {
      value: props.ecrRepository.repositoryUri,
      description: 'ECR URI the backend stack uses; tag/push here so ECS pulls the same image',
    });

    new cdk.CfnOutput(this, 'GitHubActionsDeployRoleArn', {
      value: this.deployRole.roleArn,
      description: 'Set as role-to-assume in aws-actions/configure-aws-credentials (GitHub secret)',
    });

    new cdk.CfnOutput(this, 'GitHubOidcProviderArn', {
      value: this.gitHubOidcProvider.openIdConnectProviderArn,
      description: 'IAM OIDC identity provider for GitHub Actions',
    });
  }
}
