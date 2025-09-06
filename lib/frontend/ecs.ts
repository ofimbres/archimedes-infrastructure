import * as cdk from 'aws-cdk-lib';
import { aws_iam as iam, aws_ecs_patterns as ecs_patterns, aws_ecs as ecs, aws_ec2 as ec2, aws_autoscaling as autoscaling, aws_elasticloadbalancingv2 as elbv2, Duration } from 'aws-cdk-lib';

import { Construct } from 'constructs';
import { ECR } from './ecr';
import { AmiHardwareType } from 'aws-cdk-lib/aws-ecs';
import { SubnetType } from 'aws-cdk-lib/aws-ec2';

export class EC2 extends Construct {
    constructor(scope: Construct, id: string, stage: string, ecr: ECR) {
        super(scope, id);

        const vpc = ec2.Vpc.fromLookup(this, 'archimedes-vpc', { vpcName: `${stage}-archimedes-vpc`,  });

        const cluster = new ecs.Cluster(this, 'ecs-cluster', { vpc });

        const keyPair = new ec2.CfnKeyPair(this, 'KeyPair', {
            keyName: `${stage}-archimedes-frontend-keypair`,
        });
        
        const securityGroup = new ec2.SecurityGroup(this, 'SecurityGroup', {
            vpc,
            description: 'Allow SSH access',
            allowAllOutbound: true
        });
        
        securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'allow SSH access from anywhere');

        const ec2Role = new iam.Role(this, 'EC2InstanceRole', {
            assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonEC2ContainerServiceRole'),
                iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryReadOnly')
            ]
        });


        // TODO: Refactor the code to create the IAM role for the EC2 instance
        // Create instance profile for the IAM role
        const instanceProfile = new iam.CfnInstanceProfile(this, 'Ec2InstanceProfile', {
            roles: [ec2Role.roleName],
        });

        const autoScalingGroup = new autoscaling.AutoScalingGroup(this, 'asg', {
            autoScalingGroupName: `${stage}-archimedes-frontend-asg`,
            vpc,
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MICRO),
            machineImage: ecs.EcsOptimizedImage.amazonLinux2(AmiHardwareType.ARM),
            keyName: keyPair.keyName,
            // associatePublicIpAddress: true,
            //vpcSubnets: { subnetType: SubnetType.PUBLIC },
            role: ec2Role, // Associate the IAM role with the ASG
            desiredCapacity: 1
        });

        const capacityProvider = new ecs.AsgCapacityProvider(this, 'asg-capacity-provider', { autoScalingGroup: autoScalingGroup });
        cluster.addAsgCapacityProvider(capacityProvider);

        // create a task definition with CloudWatch Logs
        const logging = new ecs.AwsLogDriver({ streamPrefix: `${stage}-archimedes-frontend-service-task-definition` })

        // Create a task definition with its own elastic network interface
        const taskDefinition = new ecs.Ec2TaskDefinition(this, 'task-definition', {
            networkMode: ecs.NetworkMode.AWS_VPC,
            
        });

        const webContainer = taskDefinition.addContainer('task-definition-frontend-container', {
            containerName: `${stage}-archimedes-frontend-container`,
            image: ecs.ContainerImage.fromRegistry('public.ecr.aws/nginx/nginx'),
            cpu: 500,
            memoryLimitMiB: 256,
            essential: true,
            logging,
            healthCheck: {
                command: ["CMD-SHELL", "curl -f http://localhost || exit 1"]
            }
        });

        webContainer.addPortMappings({
            containerPort: 80,
            hostPort: 80,
            protocol: ecs.Protocol.TCP,
        });
        
        // Create the service
        const service = new ecs.Ec2Service(this, 'ecs-frontend-service', {
            cluster,
            taskDefinition,
            serviceName: `${stage}-ecs-archimedes-frontend-service`,
            deploymentController: {
                type: ecs.DeploymentControllerType.ECS,
            },
            desiredCount: 1,
        });

        // Create ALB
        ecs_patterns.ApplicationLoadBalancedEc2Service
        const lb = new elbv2.ApplicationLoadBalancer(this, 'load-balancer', {
            vpc: vpc,
            //internetFacing: true,
            loadBalancerName: `${stage}-archimedes-frontend-service`
        });
        const listener = lb.addListener('public-listener', { port: 80, protocol: elbv2.ApplicationProtocol.HTTP, open: true });
          
        // Attach ALB to ECS Service
        listener.addTargets('ecs', {
            port: 80,
            protocol: elbv2.ApplicationProtocol.HTTP,
            targets: [service.loadBalancerTarget({
                containerName: `${stage}-archimedes-frontend-container`,
                containerPort: 80
            })]
        });
        
        new cdk.CfnOutput(this, 'load-balancer-dns', { value: lb.loadBalancerDnsName, });
    }
}