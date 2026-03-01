import * as cdk from 'aws-cdk-lib';
import { aws_codecommit as codecommit } from 'aws-cdk-lib';
import { aws_codebuild as codebuild } from 'aws-cdk-lib';
import { aws_codepipeline as codepipeline } from 'aws-cdk-lib';
import { aws_codepipeline_actions as codepipeline_actions } from 'aws-cdk-lib';
import { aws_ecs as ecs } from 'aws-cdk-lib';
import { aws_ecs_patterns as ecs_patterns } from 'aws-cdk-lib';
import { aws_ecr as ecr } from 'aws-cdk-lib';
import { aws_iam as iam } from 'aws-cdk-lib';
import { aws_ec2 as ec2 } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class CdkPipelineStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // Get the microservice name from context
        const microserviceName = "archimedes-backend-service";

        // Get the code commit parameters from context
        const repositoryName = microserviceName;
        const repositoryConstrId = microserviceName + "-codecommit-id";
        const branchName = "develop"
        const repositoryDescription = "Repository for " + microserviceName;

        // Get ecr parameters from context
        const ecrRepoConstrId = microserviceName + "-ecrrepo-id";
        const ecrRepoName = microserviceName;

        // Get code build parameters from context
        const codeBuildConstrId = microserviceName + "-codebuild-id";
        const codeBuildProjectName = microserviceName;

        // Get ecs fargate service parameters from context
        const ecsServiceName = microserviceName;
        const ecsServiceRoleConstrId = microserviceName + "ecsrole-id";
        const ecsServiceRoleName = microserviceName + "-ecs-taskexecution-role";
        const ecsFargateConstrId = microserviceName + "-ecs-fargate-id";
        const ecsFargateConstrIdProd = microserviceName + "-prod-ecs-fargate-id";

        // Get code pipeline parameters from context
        const pipelineConstrId = microserviceName + "-codepipeline-id";
        const pipelineName = microserviceName;

        // Create the repository and add the starter code. The starter code is available in the S3 bucket defined in cdk.json
        const cfnResource = new codecommit.CfnRepository(this, repositoryConstrId, {
            repositoryName: repositoryName,
        });
        cfnResource.addPropertyOverride("Code.BranchName", branchName);
        cfnResource.addPropertyOverride("RepositoryDescription", repositoryDescription);

        // Get handle to code commit repository object to use in code pipeline source action
        const codecommitRepo = codecommit.Repository.fromRepositoryName(this, "Repository", repositoryName);

        // Get handle to the ecr repository to use by code build
        const ecrRepo = new ecr.Repository(this, ecrRepoConstrId, {
            repositoryName: ecrRepoName,
        });

        // Create the starter ECS Fargate Service using AWS provided public nginx image. This will be updated later with the built image by the pipeline
        const starterImage = ecs.ContainerImage.fromRegistry("public.ecr.aws/b4f2s5k2/project-demo-reinvent/nginx-web-app:latest");
        const executionPolicy = iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AmazonECSTaskExecutionRolePolicy");
        const executionRole = new iam.Role(this, ecsServiceRoleConstrId, {
            assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
            managedPolicies: [executionPolicy],
            roleName: ecsServiceRoleName,
        });

        const vpcNonprodId = this.node.tryGetContext("vpc_nonprod_id");
        const vpcProdId = this.node.tryGetContext("vpc_prod_id");
        const ecssgNonprodId = this.node.tryGetContext("ecssg_nonprod_id");
        const ecssgProdId = this.node.tryGetContext("ecssg_prod_id");
        const ecsNonprodName = this.node.tryGetContext("ecs_nonprod_name");
        const ecsProdName = this.node.tryGetContext("ecs_prod_name");

        const vpcNonprod = ec2.Vpc.fromLookup(this, "vpc-nonprod", { vpcId: vpcNonprodId });
        const vpcProd = ec2.Vpc.fromLookup(this, "vpc-prod", { vpcId: vpcProdId });

        const ecssgNonprod = ec2.SecurityGroup.fromSecurityGroupId(this, "ecssg-nonprod", ecssgNonprodId);
        const ecssgProd = ec2.SecurityGroup.fromSecurityGroupId(this, "ecssg-prod", ecssgProdId);

        const ecsNonprod = ecs.Cluster.fromClusterAttributes(this, "ecs-nonprod", {
            clusterName: ecsNonprodName,
            vpc: vpcNonprod,
            securityGroups: [ecssgNonprod],
        });
        const ecsProd = ecs.Cluster.fromClusterAttributes(this, "ecs-prod", {
            clusterName: ecsProdName,
            vpc: vpcProd,
            securityGroups: [ecssgProd],
        });

        const albFargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, ecsFargateConstrId, {
            taskImageOptions: {
                image: starterImage,
                containerName: "app",
                executionRole,
            },
            desiredCount: 2,
            serviceName: ecsServiceName,
            listenerPort: 80,
            cluster: ecsNonprod,
        });
        const fargateservice = albFargateService.service;

        const albFargateServiceProd = new ecs_patterns.ApplicationLoadBalancedFargateService(this, ecsFargateConstrIdProd, {
            taskImageOptions: {
                image: starterImage,
                containerName: "app",
                executionRole,
            },
            desiredCount: 2,
            serviceName: ecsServiceName,
            listenerPort: 80,
            cluster: ecsProd,
        });
        const fargateserviceProd = albFargateServiceProd.service;

        // Create the CodeBuild project that creates the Docker image and pushes it to the ECR repository
        const codebuildProject = new codebuild.PipelineProject(this, codeBuildConstrId, {
            projectName: codeBuildProjectName,
            environment: {
                privileged: true,
            },
            buildSpec: codebuild.BuildSpec.fromObject({
                version: "0.2",
                phases: {
                    build: {
                        commands: [
                            "$(aws ecr get-login --region $AWS_DEFAULT_REGION --no-include-email)",
                            "docker build -t $REPOSITORY_URI:latest .",
                            "docker tag $REPOSITORY_URI:latest $REPOSITORY_URI:$CODEBUILD_RESOLVED_SOURCE_VERSION",
                        ],
                    },
                    post_build: {
                        commands: [
                            "docker push $REPOSITORY_URI:latest",
                            "docker push $REPOSITORY_URI:$CODEBUILD_RESOLVED_SOURCE_VERSION",
                            "export imageTag=$CODEBUILD_RESOLVED_SOURCE_VERSION",
                            "printf '[{\"name\":\"app\",\"imageUri\":\"%s\"}]' $REPOSITORY_URI:$imageTag > imagedefinitions.json",
                        ],
                    },
                },
                env: {
                    "exported-variables": ["imageTag"],
                },
                artifacts: {
                    files: "imagedefinitions.json",
                    "secondary-artifacts": {
                        imagedefinitions: {
                            files: "imagedefinitions.json",
                            name: "imagedefinitions",
                        },
                    },
                },
            }),
            environmentVariables: {
                REPOSITORY_URI: {
                    value: ecrRepo.repositoryUri,
                },
            },
        });

        // Grant push/pull permissions on ECR repo to CodeBuild project needed for `docker push`
        ecrRepo.grantPullPush(codebuildProject);

        // Define the source action for code pipeline
        const sourceOutput = new codepipeline.Artifact();
        const sourceAction = new codepipeline_actions.CodeCommitSourceAction({
            actionName: "CodeCommit",
            repository: codecommitRepo,
            output: sourceOutput,
            codeBuildCloneOutput: true,
        });

        // Define the build action for code pipeline
        const buildAction = new codepipeline_actions.CodeBuildAction({
            actionName: "CodeBuild",
            project: codebuildProject,
            input: sourceOutput,
            outputs: [new codepipeline.Artifact("imagedefinitions")],
            executeBatchBuild: false,
        });

        // Define the deploy action for code pipeline
        const deployAction = new codepipeline_actions.EcsDeployAction({
            actionName: "DeployECS",
            service: fargateservice,
            input: new codepipeline.Artifact("imagedefinitions"),
        });

        const manualApprovalProd = new codepipeline_actions.ManualApprovalAction({
            actionName: "Approve-Prod-Deploy",
            runOrder: 1,
        });
    }
}