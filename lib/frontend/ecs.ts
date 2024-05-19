import * as cdk from 'aws-cdk-lib';
import { aws_ecs as ecs, aws_ec2 as ec2, aws_autoscaling as autoscaling, aws_elasticloadbalancingv2 as elbv2 } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ECR } from './ecr';
import { AmiHardwareType } from 'aws-cdk-lib/aws-ecs';

export class EC2 extends Construct {
    constructor(scope: Construct, id: string, stage: string, ecr: ECR) {
        super(scope, id);

        const vpc = ec2.Vpc.fromLookup(this, 'archimedes-vpc', { vpcName: `${stage}-archimedes-vpc`, });

        const cluster = new ecs.Cluster(this, 'ecs-cluster', { vpc });

        const autoScalingGroup = new autoscaling.AutoScalingGroup(this, 'asg', {
            autoScalingGroupName: `${stage}-archimedes-frontend-asg`,
            vpc,
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MICRO),
            machineImage: ecs.EcsOptimizedImage.amazonLinux2(AmiHardwareType.ARM),
            desiredCapacity: 1
        });

        const capacityProvider = new ecs.AsgCapacityProvider(this, 'asg-capacity-provider', { autoScalingGroup: autoScalingGroup });
        cluster.addAsgCapacityProvider(capacityProvider);

        // Create a task definition with its own elastic network interface
        const taskDefinition = new ecs.Ec2TaskDefinition(this, 'task-definition', {
            networkMode: ecs.NetworkMode.AWS_VPC,
        });

           // create a task definition with CloudWatch Logs
        const logging = new ecs.AwsLogDriver({ streamPrefix: `${stage}-archimedes-frontend-service-task-definition` })

        const webContainer = taskDefinition.addContainer('task-definition-frontend-container', {
            containerName: `${stage}-archimedes-frontend-container`,
            image: ecs.ContainerImage.fromEcrRepository(ecr.ecr_repository),
            cpu: 100,
            memoryLimitMiB: 256,
            essential: true,
            logging
        });

        webContainer.addPortMappings({
            containerPort: 80,
            hostPort: 80,
            protocol: ecs.Protocol.TCP,
        });
        
        // Create the service
        const service = new ecs.Ec2Service(this, 'ecs-frontend-service', {
            cluster,
            taskDefinition
        });

        // Create ALB
        const lb = new elbv2.ApplicationLoadBalancer(this, 'load-balancer', {
            vpc: vpc,
            internetFacing: true,
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
            })],
            // include health check (default is none)
            healthCheck: {
                port: "80",
                protocol: elbv2.Protocol.HTTP,
                interval: cdk.Duration.seconds(60),
                path:"/health/",
                timeout: cdk.Duration.seconds(5),
            }
        });
        
        new cdk.CfnOutput(this, 'load-balancer-dns', { value: lb.loadBalancerDnsName, });
    }
}