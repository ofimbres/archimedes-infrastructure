import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as rds from 'aws-cdk-lib/aws-rds';
import { Construct } from 'constructs';

export interface BackendStackProps extends cdk.StackProps {
  /**
   * Stage name (e.g. dev, prod). Used for resource naming.
   */
  stage?: string;
  /**
   * Google OAuth client ID for Cognito. Create in Google Cloud Console.
   */
  googleClientId?: string;
  /**
   * Google OAuth client secret. Prefer passing via env and not committing.
   */
  googleClientSecret?: string;
  /**
   * Additional Cognito callback URLs (e.g. frontend CloudFront URL for auth redirects).
   */
  additionalCallbackUrls?: string[];
  /**
   * Additional Cognito logout URLs (e.g. frontend CloudFront URL).
   */
  additionalLogoutUrls?: string[];
}

/**
 * Backend stack: Cognito (Google + custom verification email) + ECS on EC2 for the backend app.
 *
 * Cost-conscious setup:
 * - VPC: free (no NAT Gateway; public subnets only).
 * - ECS on EC2: one t4g.micro (~$6–7/mo) instead of Fargate (~$15–20/mo).
 * - ALB: ~$16/mo + small LCU usage.
 * - Cognito: free tier 50k MAU; Lambda (custom email): free tier.
 */
export class BackendStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;
  public readonly backendRepository: ecr.Repository;
  public readonly cluster: ecs.Cluster;
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;
  public readonly database: rds.DatabaseInstance;

  constructor(scope: Construct, id: string, props?: BackendStackProps) {
    super(scope, id, props);

    const stage = props?.stage ?? 'dev';
    const googleClientId = props?.googleClientId ?? process.env.GOOGLE_CLIENT_ID;
    const googleClientSecret = props?.googleClientSecret ?? process.env.GOOGLE_CLIENT_SECRET;
    const baseCallbackUrls = ['http://localhost:8001/api/v1/auth/callback', 'https://localhost:8001/api/v1/auth/callback'];
    const baseLogoutUrls = ['http://localhost:3000', 'https://localhost:3000'];
    const callbackUrls = [...baseCallbackUrls, ...(props?.additionalCallbackUrls ?? [])];
    const logoutUrls = [...baseLogoutUrls, ...(props?.additionalLogoutUrls ?? [])];

    // --- VPC (free; no NAT Gateway to avoid ~$32/mo) ---
    const vpc = new ec2.Vpc(this, 'Vpc', {
      maxAzs: 2,
      natGateways: 0, // Use public subnets only — Fargate with assignPublicIp works; saves ~$32/mo vs 1 NAT
    });

    // --- Custom verification email Lambda ---
    const customMessageFn = new lambda.Function(this, 'CustomMessageFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
exports.handler = async (event) => {
  const { triggerSource, request } = event;
  const code = request.codeParameter || '{####}';
  const username = request.userAttributes?.email || request.usernameParameter || 'there';
  const appName = process.env.APP_NAME || 'Archimedes';

  if (triggerSource === 'CustomMessage_SignUp' || triggerSource === 'CustomMessage_ResendCode') {
    event.response.emailSubject = \`Verify your \${appName} account\`;
    event.response.emailMessage = \`Hello,\\n\\nYour verification code is: \${code}\\n\\nEnter this code to complete sign-up. If you didn't request this, you can ignore this email.\\n\\n— \${appName}\`;
  }
  if (triggerSource === 'CustomMessage_ForgotPassword') {
    event.response.emailSubject = \`Reset your \${appName} password\`;
    event.response.emailMessage = \`Hello \${username},\\n\\nYour password reset code is: \${code}\\n\\n— \${appName}\`;
  }
  if (triggerSource === 'CustomMessage_AdminCreateUser') {
    event.response.emailSubject = \`Welcome to \${appName}\`;
    event.response.emailMessage = \`Hello,\\n\\nYour temporary password is: \${code}\\n\\nPlease sign in and change your password.\\n\\n— \${appName}\`;
  }
  return event;
};
      `),
      timeout: cdk.Duration.seconds(5),
      logRetention: logs.RetentionDays.ONE_WEEK,
      environment: {
        APP_NAME: 'Archimedes',
      },
    });

    // --- Cognito User Pool ---
    this.userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: `${stage}-archimedes-user-pool`,
      signInAliases: { email: true, username: true },
      standardAttributes: {
        givenName: { required: true, mutable: true },
        familyName: { required: true, mutable: true },
      },
      passwordPolicy: {
        minLength: 8,
        requireDigits: true,
        requireLowercase: true,
        requireUppercase: true,
        requireSymbols: false,
      },
      selfSignUpEnabled: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      lambdaTriggers: {
        customMessage: customMessageFn,
      },
    });

    // User Pool domain (required for hosted UI / Google OAuth)
    const domain = this.userPool.addDomain('Domain', {
      cognitoDomain: {
        domainPrefix: `archimedes-${stage}-${this.account}`.toLowerCase().replace(/[^a-z0-9-]/g, ''),
      },
    });

    // Google identity provider (optional: only if credentials provided)
    if (googleClientId && googleClientSecret) {
      new cognito.UserPoolIdentityProviderGoogle(this, 'GoogleIdp', {
        userPool: this.userPool,
        clientId: googleClientId,
        clientSecretValue: cdk.SecretValue.unsafePlainText(googleClientSecret),
        scopes: ['openid', 'email', 'profile'],
        attributeMapping: {
          email: cognito.ProviderAttribute.GOOGLE_EMAIL,
          givenName: cognito.ProviderAttribute.GOOGLE_GIVEN_NAME,
          familyName: cognito.ProviderAttribute.GOOGLE_FAMILY_NAME,
        },
      });
    }

    // App client (OAuth + hosted UI for Google)
    this.userPoolClient = this.userPool.addClient('AppClient', {
      userPoolClientName: `${stage}-archimedes-app-client`,
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      oAuth: googleClientId
        ? {
            flows: { authorizationCodeGrant: true },
            scopes: [cognito.OAuthScope.OPENID, cognito.OAuthScope.EMAIL, cognito.OAuthScope.PROFILE],
            callbackUrls,
            logoutUrls,
          }
        : undefined,
      generateSecret: false,
    });

    // Groups
    new cognito.CfnUserPoolGroup(this, 'StudentsGroup', {
      groupName: 'students',
      userPoolId: this.userPool.userPoolId,
    });
    new cognito.CfnUserPoolGroup(this, 'TeachersGroup', {
      groupName: 'teachers',
      userPoolId: this.userPool.userPoolId,
    });
    new cognito.CfnUserPoolGroup(this, 'AdminsGroup', {
      groupName: 'admins',
      userPoolId: this.userPool.userPoolId,
    });

    // --- ECR for backend image ---
    this.backendRepository = new ecr.Repository(this, 'BackendRepo', {
      repositoryName: `${stage}-archimedes-backend`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      emptyOnDelete: true,
    });

    // --- Security groups: backend (ECS/EC2) and RDS ---
    const backendSg = new ec2.SecurityGroup(this, 'BackendSg', {
      vpc,
      description: 'Backend ECS/EC2',
      allowAllOutbound: true,
    });

    const dbSg = new ec2.SecurityGroup(this, 'DbSg', {
      vpc,
      description: 'RDS Postgres',
      allowAllOutbound: true,
    });
    dbSg.connections.allowFrom(backendSg, ec2.Port.tcp(5432), 'Postgres from backend');

    // --- RDS Postgres (cheap: db.t4g.micro, ~$12–15/mo) ---
    this.database = new rds.DatabaseInstance(this, 'Database', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE4_GRAVITON, ec2.InstanceSize.MICRO),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      securityGroups: [dbSg],
      databaseName: 'archimedes',
      credentials: rds.Credentials.fromGeneratedSecret('postgres'),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      allocatedStorage: 20,
      publiclyAccessible: false, // Backend in same VPC can reach it; no direct internet
    });

    // --- ECS on EC2 (cheaper than Fargate: ~$6–7/mo for one t4g.micro) ---
    this.cluster = new ecs.Cluster(this, 'Cluster', {
      vpc,
      clusterName: `${stage}-archimedes-backend-cluster`,
    });

    const ec2Role = new iam.Role(this, 'EC2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonEC2ContainerServiceforEC2Role'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryReadOnly'),
      ],
    });

    const asg = new autoscaling.AutoScalingGroup(this, 'ASG', {
      vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MICRO),
      machineImage: ecs.EcsOptimizedImage.amazonLinux2(ecs.AmiHardwareType.ARM),
      minCapacity: 1,
      maxCapacity: 1,
      desiredCapacity: 1,
      role: ec2Role,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      associatePublicIpAddress: true,
      securityGroup: backendSg,
    });

    const capacityProvider = new ecs.AsgCapacityProvider(this, 'CapacityProvider', {
      autoScalingGroup: asg,
      capacityProviderName: `${stage}-archimedes-ec2-capacity`,
    });
    this.cluster.addAsgCapacityProvider(capacityProvider);

    // BRIDGE: outbound uses the EC2 host's public IP (no NAT). EC2 launch type does not support assignPublicIp on awsvpc tasks.
    const taskDefinition = new ecs.Ec2TaskDefinition(this, 'BackendTask', {
      networkMode: ecs.NetworkMode.BRIDGE,
    });

    const logDriver = new ecs.AwsLogDriver({
      streamPrefix: `${stage}-archimedes-backend`,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    const container = taskDefinition.addContainer('Backend', {
      image: ecs.ContainerImage.fromRegistry('public.ecr.aws/docker/library/nginx:alpine'),
      containerName: 'backend',
      cpu: 256,
      memoryLimitMiB: 256,
      portMappings: [{ containerPort: 80, hostPort: 80, protocol: ecs.Protocol.TCP }],
      logging: logDriver,
      healthCheck: {
        command: ['CMD-SHELL', 'curl -f http://localhost/ || exit 1'],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
      },
    });

    const service = new ecs.Ec2Service(this, 'BackendService', {
      cluster: this.cluster,
      taskDefinition,
      serviceName: `${stage}-archimedes-backend-service`,
      desiredCount: 1,
      capacityProviderStrategies: [
        { capacityProvider: capacityProvider.capacityProviderName, weight: 1 },
      ],
    });

    this.loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'ALB', {
      vpc,
      internetFacing: true,
      loadBalancerName: `${stage}-archimedes-backend-alb`,
    });

    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
      vpc,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.INSTANCE,
      healthCheck: {
        path: '/',
        interval: cdk.Duration.seconds(30),
      },
    });

    service.attachToApplicationTargetGroup(targetGroup);

    this.loadBalancer.addListener('Listener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });
    backendSg.connections.allowFrom(this.loadBalancer, ec2.Port.tcp(80), 'ALB to backend');

    // --- Outputs ---
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
      description: 'Cognito User Pool ID',
    });
    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: this.userPoolClient.userPoolClientId,
      description: 'Cognito App Client ID',
    });
    new cdk.CfnOutput(this, 'CognitoDomain', {
      value: domain.domainName,
      description: 'Cognito hosted UI domain (domainPrefix.auth.<region>.amazoncognito.com)',
    });
    new cdk.CfnOutput(this, 'BackendRepositoryUri', {
      value: this.backendRepository.repositoryUri,
      description: 'ECR repository URI for backend image',
    });
    new cdk.CfnOutput(this, 'BackendUrl', {
      value: `http://${this.loadBalancer.loadBalancerDnsName}`,
      description: 'Backend ALB URL (replace with your image and add HTTPS in production)',
    });
    new cdk.CfnOutput(this, 'DbSecretArn', {
      value: this.database.secret!.secretArn,
      description: 'Secrets Manager ARN for RDS master credentials (username, password, host, port)',
    });
    new cdk.CfnOutput(this, 'DbEndpoint', {
      value: this.database.dbInstanceEndpointAddress,
      description: 'RDS Postgres endpoint (use with DbSecretArn for connection string)',
    });
  }
}
