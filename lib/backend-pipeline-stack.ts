import * as cdk from 'aws-cdk-lib';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codestarconnections from 'aws-cdk-lib/aws-codestarconnections';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import { Construct } from 'constructs';

export interface BackendPipelineStackProps extends cdk.StackProps {
  stage?: string;
  /** ECS service from ArchimedesBackendStack. */
  backendService: ecs.IBaseService;
  /** ECR repository from ArchimedesBackendStack (build pushes here). */
  ecrRepository: ecr.IRepository;
  /**
   * Container name in the task definition (must match BackendStack).
   * @default backend
   */
  ecsContainerName?: string;
  /**
   * When true, source is AWS CodeCommit (creates a new repo unless codeCommitRepositoryName imports existing).
   * When false, source is GitHub via CodeStar Connections.
   */
  useCodeCommit?: boolean;
  /**
   * Existing CodeStar connection ARN. If omitted for GitHub source, CDK creates a `AWS::CodeStarConnections::Connection`;
   * open the AWS console and complete GitHub authorization (PENDING → AVAILABLE) before the pipeline can fetch source.
   */
  codeStarConnectionArn?: string;
  githubOwner?: string;
  githubRepo?: string;
  githubBranch?: string;
  /** When useCodeCommit and set, import this repo instead of creating one. */
  codeCommitRepositoryName?: string;
  requireManualApprovalBeforeDeploy?: boolean;
}

/**
 * CI/CD for the backend Docker image: source → CodeBuild (docker build/push to ECR) → ECS deploy.
 * Modeled on python-comparison/cicd_backend_stack.py but targets the existing ECS-on-EC2 service and ECR from BackendStack.
 */
export class BackendPipelineStack extends cdk.Stack {
  public readonly pipeline: codepipeline.Pipeline;
  public readonly buildProject: codebuild.PipelineProject;
  public readonly codeCommitRepository?: codecommit.IRepository;
  /** Present when CDK provisions the GitHub CodeStar connection (no codeStarConnectionArn in props). */
  public readonly gitHubConnection?: codestarconnections.CfnConnection;

  constructor(scope: Construct, id: string, props: BackendPipelineStackProps) {
    super(scope, id, props);

    const stage = props.stage ?? 'dev';
    const useCodeCommit = props.useCodeCommit ?? false;
    const containerName = props.ecsContainerName ?? 'backend';
    const branch = props.githubBranch ?? 'main';

    if (!useCodeCommit && (!props.githubOwner || !props.githubRepo)) {
      throw new Error('BackendPipelineStack: githubOwner and githubRepo are required when useCodeCommit is false');
    }

    let codeStarConnectionArnForGithub: string | undefined;
    if (!useCodeCommit) {
      const existing = props.codeStarConnectionArn?.trim();
      if (existing) {
        codeStarConnectionArnForGithub = existing;
      } else {
        this.gitHubConnection = new codestarconnections.CfnConnection(this, 'GitHubConnection', {
          connectionName: `${stage}-archimedes-backend-github`,
          providerType: 'GitHub',
        });
        codeStarConnectionArnForGithub = this.gitHubConnection.attrConnectionArn;
        new cdk.CfnOutput(this, 'CodeStarConnectionArn', {
          value: codeStarConnectionArnForGithub,
          description:
            'Complete GitHub authorization under Developer Tools → Settings → Connections until AVAILABLE; then start the pipeline.',
        });
      }
    }

    const sourceOutput = new codepipeline.Artifact('Source');
    const buildOutput = new codepipeline.Artifact('BuildOutput');

    let sourceAction: codepipeline.IAction;
    if (useCodeCommit) {
      const repo =
        props.codeCommitRepositoryName != null && props.codeCommitRepositoryName.length > 0
          ? codecommit.Repository.fromRepositoryName(this, 'CodeCommitRepo', props.codeCommitRepositoryName)
          : new codecommit.Repository(this, 'CodeCommitRepo', {
              repositoryName: `${stage}-archimedes-backend-source`,
              description: 'Backend source for CodePipeline (mirror from GitHub or push here)',
            });
      this.codeCommitRepository = repo;
      sourceAction = new codepipeline_actions.CodeCommitSourceAction({
        actionName: 'CodeCommit',
        repository: repo,
        branch,
        output: sourceOutput,
        codeBuildCloneOutput: true,
      });
    } else {
      sourceAction = new codepipeline_actions.CodeStarConnectionsSourceAction({
        actionName: 'GitHub',
        owner: props.githubOwner!,
        repo: props.githubRepo!,
        branch,
        connectionArn: codeStarConnectionArnForGithub!,
        output: sourceOutput,
      });
    }

    this.buildProject = new codebuild.PipelineProject(this, 'BuildImage', {
      projectName: `${stage}-archimedes-backend-build`,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        privileged: true,
      },
      environmentVariables: {
        REPOSITORY_URI: { value: props.ecrRepository.repositoryUri },
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          pre_build: {
            commands: [
              'echo Logging in to Amazon ECR...',
              'REPO_HOST="${REPOSITORY_URI%%/*}"',
              'aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $REPO_HOST',
            ],
          },
          build: {
            commands: [
              'echo Build started on `date`',
              'docker build -t $REPOSITORY_URI:$CODEBUILD_RESOLVED_SOURCE_VERSION .',
              'docker tag $REPOSITORY_URI:$CODEBUILD_RESOLVED_SOURCE_VERSION $REPOSITORY_URI:latest',
            ],
          },
          post_build: {
            commands: [
              'docker push $REPOSITORY_URI:$CODEBUILD_RESOLVED_SOURCE_VERSION',
              'docker push $REPOSITORY_URI:latest',
              `printf '[{"name":"${containerName}","imageUri":"%s"}]' $REPOSITORY_URI:$CODEBUILD_RESOLVED_SOURCE_VERSION > imagedefinitions.json`,
            ],
          },
        },
        artifacts: {
          files: ['imagedefinitions.json'],
        },
      }),
    });
    props.ecrRepository.grantPullPush(this.buildProject);

    const buildAction = new codepipeline_actions.CodeBuildAction({
      actionName: 'DockerBuild',
      project: this.buildProject,
      input: sourceOutput,
      outputs: [buildOutput],
    });

    const deployAction = new codepipeline_actions.EcsDeployAction({
      actionName: 'DeployECS',
      service: props.backendService,
      input: buildOutput,
    });

    const stages: codepipeline.StageProps[] = [
      { stageName: 'Source', actions: [sourceAction] },
      { stageName: 'Build', actions: [buildAction] },
    ];

    if (props.requireManualApprovalBeforeDeploy) {
      stages.push({
        stageName: 'Approve',
        actions: [
          new codepipeline_actions.ManualApprovalAction({
            actionName: 'ApproveProductionDeploy',
          }),
        ],
      });
    }

    stages.push({ stageName: 'Deploy', actions: [deployAction] });

    this.pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
      pipelineName: `${stage}-archimedes-backend-pipeline`,
      restartExecutionOnUpdate: true,
      stages,
    });

    new cdk.CfnOutput(this, 'PipelineName', {
      value: this.pipeline.pipelineName,
      description: 'CodePipeline name',
    });
  }
}
