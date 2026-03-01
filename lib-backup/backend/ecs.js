"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EC2 = void 0;
const cdk = require("aws-cdk-lib");
const aws_cdk_lib_1 = require("aws-cdk-lib");
const constructs_1 = require("constructs");
const aws_ecs_1 = require("aws-cdk-lib/aws-ecs");
const aws_ec2_1 = require("aws-cdk-lib/aws-ec2");
class EC2 extends constructs_1.Construct {
    constructor(scope, id, stage, ecr) {
        super(scope, id);
        const vpc = aws_cdk_lib_1.aws_ec2.Vpc.fromLookup(this, 'archimedes-vpc', { vpcName: `${stage}-archimedes-vpc`, });
        const cluster = new aws_cdk_lib_1.aws_ecs.Cluster(this, 'ecs-cluster', { vpc });
        const keyPair = new aws_cdk_lib_1.aws_ec2.CfnKeyPair(this, 'KeyPair', {
            keyName: `${stage}-archimedes-keypair`,
        });
        // const securityGroup = new ec2.SecurityGroup(this, 'SecurityGroup', {
        //     vpc,
        //     description: 'Allow SSH access',
        //     allowAllOutbound: true
        // });
        // securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'allow SSH access from anywhere');
        const autoScalingGroup = new aws_cdk_lib_1.aws_autoscaling.AutoScalingGroup(this, 'asg', {
            autoScalingGroupName: `${stage}-archimedes-backend-asg`,
            vpc,
            instanceType: aws_cdk_lib_1.aws_ec2.InstanceType.of(aws_cdk_lib_1.aws_ec2.InstanceClass.T4G, aws_cdk_lib_1.aws_ec2.InstanceSize.SMALL),
            machineImage: aws_cdk_lib_1.aws_ecs.EcsOptimizedImage.amazonLinux2(aws_ecs_1.AmiHardwareType.ARM),
            keyName: keyPair.keyName,
            associatePublicIpAddress: true,
            vpcSubnets: { subnetType: aws_ec2_1.SubnetType.PUBLIC },
            desiredCapacity: 1
        });
        const capacityProvider = new aws_cdk_lib_1.aws_ecs.AsgCapacityProvider(this, 'asg-capacity-provider', { autoScalingGroup: autoScalingGroup });
        cluster.addAsgCapacityProvider(capacityProvider);
        // Create a task definition with its own elastic network interface
        const taskDefinition = new aws_cdk_lib_1.aws_ecs.Ec2TaskDefinition(this, 'task-definition', {
            networkMode: aws_cdk_lib_1.aws_ecs.NetworkMode.AWS_VPC,
        });
        // create a task definition with CloudWatch Logs
        const logging = new aws_cdk_lib_1.aws_ecs.AwsLogDriver({ streamPrefix: `${stage}-archimedes-backend-service-task-definition` });
        const webContainer = taskDefinition.addContainer('task-definition-backend-container', {
            containerName: `${stage}-archimedes-backend-container`,
            image: aws_cdk_lib_1.aws_ecs.ContainerImage.fromEcrRepository(ecr.ecr_repository),
            memoryLimitMiB: 1024,
            essential: true,
            logging,
        });
        webContainer.addPortMappings({
            containerPort: 80,
            hostPort: 80,
            protocol: aws_cdk_lib_1.aws_ecs.Protocol.TCP,
        });
        // Create the service
        const service = new aws_cdk_lib_1.aws_ecs.Ec2Service(this, 'ecs-backend-service', {
            cluster,
            taskDefinition
        });
        // Create ALB
        const lb = new aws_cdk_lib_1.aws_elasticloadbalancingv2.ApplicationLoadBalancer(this, 'load-balancer', {
            vpc: vpc,
            internetFacing: true,
            loadBalancerName: `${stage}-archimedes-backend-service`
        });
        const listener = lb.addListener('public-listener', { port: 80, protocol: aws_cdk_lib_1.aws_elasticloadbalancingv2.ApplicationProtocol.HTTP, open: true });
        // Attach ALB to ECS Service
        listener.addTargets('ecs', {
            port: 80,
            protocol: aws_cdk_lib_1.aws_elasticloadbalancingv2.ApplicationProtocol.HTTP,
            targets: [service.loadBalancerTarget({
                    containerName: `${stage}-archimedes-backend-container`,
                    containerPort: 80
                })],
            // include health check (default is none)
            healthCheck: {
                port: "80",
                protocol: aws_cdk_lib_1.aws_elasticloadbalancingv2.Protocol.HTTP,
                interval: cdk.Duration.seconds(60),
                path: "/healthcheck/",
                timeout: cdk.Duration.seconds(5),
            }
        });
        new cdk.CfnOutput(this, 'load-balancer-dns', { value: lb.loadBalancerDnsName, });
    }
}
exports.EC2 = EC2;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWNzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZWNzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLG1DQUFtQztBQUNuQyw2Q0FBa0k7QUFDbEksMkNBQXVDO0FBRXZDLGlEQUFzRDtBQUN0RCxpREFBaUQ7QUFFakQsTUFBYSxHQUFJLFNBQVEsc0JBQVM7SUFDOUIsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFhLEVBQUUsR0FBUTtRQUM3RCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBRWpCLE1BQU0sR0FBRyxHQUFHLHFCQUFHLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsZ0JBQWdCLEVBQUUsRUFBRSxPQUFPLEVBQUUsR0FBRyxLQUFLLGlCQUFpQixHQUFJLENBQUMsQ0FBQztRQUVqRyxNQUFNLE9BQU8sR0FBRyxJQUFJLHFCQUFHLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxhQUFhLEVBQUUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDO1FBRTlELE1BQU0sT0FBTyxHQUFHLElBQUkscUJBQUcsQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRTtZQUNoRCxPQUFPLEVBQUUsR0FBRyxLQUFLLHFCQUFxQjtTQUN6QyxDQUFDLENBQUM7UUFFSCx1RUFBdUU7UUFDdkUsV0FBVztRQUNYLHVDQUF1QztRQUN2Qyw2QkFBNkI7UUFDN0IsTUFBTTtRQUVOLHdHQUF3RztRQUV4RyxNQUFNLGdCQUFnQixHQUFHLElBQUksNkJBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFO1lBQ25FLG9CQUFvQixFQUFFLEdBQUcsS0FBSyx5QkFBeUI7WUFDdkQsR0FBRztZQUNILFlBQVksRUFBRSxxQkFBRyxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUMscUJBQUcsQ0FBQyxhQUFhLENBQUMsR0FBRyxFQUFFLHFCQUFHLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQztZQUNo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cEIsT0FBTyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQzthQUNuQztTQUNKLENBQUMsQ0FBQztRQUVILElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsbUJBQW1CLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFBRSxDQUFDLG1CQUFtQixHQUFHLENBQUMsQ0FBQztJQUNyRixDQUFDO0NBQ0o7QUExRkQsa0JBMEZDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IGF3c19lY3MgYXMgZWNzLCBhd3NfZWMyIGFzIGVjMiwgYXdzX2F1dG9zY2FsaW5nIGFzIGF1dG9zY2FsaW5nLCBhd3NfZWxhc3RpY2xvYWRiYWxhbmNpbmd2MiBhcyBlbGJ2MiB9IGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuaW1wb3J0IHsgRUNSIH0gZnJvbSAnLi9lY3InO1xuaW1wb3J0IHsgQW1pSGFyZHdhcmVUeXBlIH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWVjcyc7XG5pbXBvcnQgeyBTdWJuZXRUeXBlIH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWVjMic7XG5cbmV4cG9ydCBjbGFzcyBFQzIgZXh0ZW5kcyBDb25zdHJ1Y3Qge1xuICAgIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHN0YWdlOiBzdHJpbmcsIGVjcjogRUNSKSB7XG4gICAgICAgIHN1cGVyKHNjb3BlLCBpZCk7XG5cbiAgICAgICAgY29uc3QgdnBjID0gZWMyLlZwYy5mcm9tTG9va3VwKHRoaXMsICdhcmNoaW1lZGVzLXZwYycsIHsgdnBjTmFtZTogYCR7c3RhZ2V9LWFyY2hpbWVkZXMtdnBjYCwgIH0pO1xuXG4gICAgICAgIGNvbnN0IGNsdXN0ZXIgPSBuZXcgZWNzLkNsdXN0ZXIodGhpcywgJ2Vjcy1jbHVzdGVyJywgeyB2cGMgfSk7XG5cbiAgICAgICAgY29uc3Qga2V5UGFpciA9IG5ldyBlYzIuQ2ZuS2V5UGFpcih0aGlzLCAnS2V5UGFpcicsIHtcbiAgICAgICAgICAgIGtleU5hbWU6IGAke3N0YWdlfS1hcmNoaW1lZGVzLWtleXBhaXJgLFxuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIC8vIGNvbnN0IHNlY3VyaXR5R3JvdXAgPSBuZXcgZWMyLlNlY3VyaXR5R3JvdXAodGhpcywgJ1NlY3VyaXR5R3JvdXAnLCB7XG4gICAgICAgIC8vICAgICB2cGMsXG4gICAgICAgIC8vICAgICBkZXNjcmlwdGlvbjogJ0FsbG93IFNTSCBhY2Nlc3MnLFxuICAgICAgICAvLyAgICAgYWxsb3dBbGxPdXRib3VuZDogdHJ1ZVxuICAgICAgICAvLyB9KTtcbiAgICAgICAgXG4gICAgICAgIC8vIHNlY3VyaXR5R3JvdXAuYWRkSW5ncmVzc1J1bGUoZWMyLlBlZXIuYW55SXB2NCgpLCBlYzIuUG9ydC50Y3AoMjIpLCAnYWxsb3cgU1NIIGFjY2VzcyBmcm9tIGFueXdoZXJlJyk7XG5cbiAgICAgICAgY29uc3QgYXV0b1NjYWxpbmdHcm91cCA9IG5ldyBhdXRvc2NhbGluZy5BdXRvU2NhbGluZ0dyb3VwKHRoaXMsICdhc2cnLCB7XG4gICAgICAgICAgICBhdXRvU2NhbGluZ0dyb3VwTmFtZTogYCR7c3RhZ2V9LWFyY2hpbWVkZXMtYmFja2VuZC1hc2dgLFxuICAgICAgICAgICAgdnBjLFxuICAgICAgICAgICAgaW5zdGFuY2VUeXBlOiBlYzIuSW5zdGFuY2VUeXBlLm9mKGVjMi5JbnN0YW5jZUNsYXNzLlQ0RywgZWMyLkluc3RhbmNlU2l6ZS5TTUFMTCksXG4gICAgICAgICAgICBtYWNoaW5lSW1hZ2U6IGVjcy5FY3NPcHRpbWl6ZWRJbWFnZS5hbWF6b25MaW51eDIoQW1pSGFyZHdhcmVUeXBlLkFSTSksXG4gICAgICAgICAgICBrZXlOYW1lOiBrZXlQYWlyLmtleU5hbWUsXG4gICAgICAgICAgICBhc3NvY2lhdGVQdWJsaWNJcEFkZHJlc3M6IHRydWUsXG4gICAgICAgICAgICB2cGNTdWJuZXRzOiB7IHN1Ym5ldFR5cGU6IFN1Ym5ldFR5cGUuUFVCTElDIH0sXG4gICAgICAgICAgICBkZXNpcmVkQ2FwYWNpdHk6IDFcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgY2FwYWNpdHlQcm92aWRlciA9IG5ldyBlY3MuQXNnQ2FwYWNpdHlQcm92aWRlcih0aGlzLCAnYXNnLWNhcGFjaXR5LXByb3ZpZGVyJywgeyBhdXRvU2NhbGluZ0dyb3VwOiBhdXRvU2NhbGluZ0dyb3VwIH0pO1xuICAgICAgICBjbHVzdGVyLmFkZEFzZ0NhcGFjaXR5UHJvdmlkZXIoY2FwYWNpdHlQcm92aWRlcik7XG5cbiAgICAgICAgLy8gQ3JlYXRlIGEgdGFzayBkZWZpbml0aW9uIHdpdGggaXRzIG93biBlbGFzdGljIG5ldHdvcmsgaW50ZXJmYWNlXG4gICAgICAgIGNvbnN0IHRhc2tEZWZpbml0aW9uID0gbmV3IGVjcy5FYzJUYXNrRGVmaW5pdGlvbih0aGlzLCAndGFzay1kZWZpbml0aW9uJywge1xuICAgICAgICAgICAgbmV0d29ya01vZGU6IGVjcy5OZXR3b3JrTW9kZS5BV1NfVlBDLFxuICAgICAgICB9KTtcblxuICAgICAgICAgICAvLyBjcmVhdGUgYSB0YXNrIGRlZmluaXRpb24gd2l0aCBDbG91ZFdhdGNoIExvZ3NcbiAgICAgICAgY29uc3QgbG9nZ2luZyA9IG5ldyBlY3MuQXdzTG9nRHJpdmVyKHsgc3RyZWFtUHJlZml4OiBgJHtzdGFnZX0tYXJjaGltZWRlcy1iYWNrZW5kLXNlcnZpY2UtdGFzay1kZWZpbml0aW9uYCB9KVxuXG4gICAgICAgIGNvbnN0IHdlYkNvbnRhaW5lciA9IHRhc2tEZWZpbml0aW9uLmFkZENvbnRhaW5lcigndGFzay1kZWZpbml0aW9uLWJhY2tlbmQtY29udGFpbmVyJywge1xuICAgICAgICAgICAgY29udGFpbmVyTmFtZTogYCR7c3RhZ2V9LWFyY2hpbWVkZXMtYmFja2VuZC1jb250YWluZXJgLFxuICAgICAgICAgICAgaW1hZ2U6IGVjcy5Db250YWluZXJJbWFnZS5mcm9tRWNyUmVwb3NpdG9yeShlY3IuZWNyX3JlcG9zaXRvcnkpLFxuICAgICAgICAgICAgbWVtb3J5TGltaXRNaUI6IDEwMjQsXG4gICAgICAgICAgICBlc3NlbnRpYWw6IHRydWUsXG4gICAgICAgICAgICBsb2dnaW5nLFxuICAgICAgICB9KTtcblxuICAgICAgICB3ZWJDb250YWluZXIuYWRkUG9ydE1hcHBpbmdzKHtcbiAgICAgICAgICAgIGNvbnRhaW5lclBvcnQ6IDgwLFxuICAgICAgICAgICAgaG9zdFBvcnQ6IDgwLFxuICAgICAgICAgICAgcHJvdG9jb2w6IGVjcy5Qcm90b2NvbC5UQ1AsXG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgLy8gQ3JlYXRlIHRoZSBzZXJ2aWNlXG4gICAgICAgIGNvbnN0IHNlcnZpY2UgPSBuZXcgZWNzLkVjMlNlcnZpY2UodGhpcywgJ2Vjcy1iYWNrZW5kLXNlcnZpY2UnLCB7XG4gICAgICAgICAgICBjbHVzdGVyLFxuICAgICAgICAgICAgdGFza0RlZmluaXRpb25cbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gQ3JlYXRlIEFMQlxuICAgICAgICBjb25zdCBsYiA9IG5ldyBlbGJ2Mi5BcHBsaWNhdGlvbkxvYWRCYWxhbmNlcih0aGlzLCAnbG9hZC1iYWxhbmNlcicsIHtcbiAgICAgICAgICAgIHZwYzogdnBjLFxuICAgICAgICAgICAgaW50ZXJuZXRGYWNpbmc6IHRydWUsXG4gICAgICAgICAgICBsb2FkQmFsYW5jZXJOYW1lOiBgJHtzdGFnZX0tYXJjaGltZWRlcy1iYWNrZW5kLXNlcnZpY2VgXG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBsaXN0ZW5lciA9IGxiLmFkZExpc3RlbmVyKCdwdWJsaWMtbGlzdGVuZXInLCB7IHBvcnQ6IDgwLCBwcm90b2NvbDogZWxidjIuQXBwbGljYXRpb25Qcm90b2NvbC5IVFRQLCBvcGVuOiB0cnVlIH0pO1xuICAgICAgICAgIFxuICAgICAgICAvLyBBdHRhY2ggQUxCIHRvIEVDUyBTZXJ2aWNlXG4gICAgICAgIGxpc3RlbmVyLmFkZFRhcmdldHMoJ2VjcycsIHtcbiAgICAgICAgICAgIHBvcnQ6IDgwLFxuICAgICAgICAgICAgcHJvdG9jb2w6IGVsYnYyLkFwcGxpY2F0aW9uUHJvdG9jb2wuSFRUUCxcbiAgICAgICAgICAgIHRhcmdldHM6IFtzZXJ2aWNlLmxvYWRCYWxhbmNlclRhcmdldCh7XG4gICAgICAgICAgICAgICAgY29udGFpbmVyTmFtZTogYCR7c3RhZ2V9LWFyY2hpbWVkZXMtYmFja2VuZC1jb250YWluZXJgLFxuICAgICAgICAgICAgICAgIGNvbnRhaW5lclBvcnQ6IDgwXG4gICAgICAgICAgICB9KV0sXG4gICAgICAgICAgICAvLyBpbmNsdWRlIGhlYWx0aCBjaGVjayAoZGVmYXVsdCBpcyBub25lKVxuICAgICAgICAgICAgaGVhbHRoQ2hlY2s6IHtcbiAgICAgICAgICAgICAgICBwb3J0OiBcIjgwXCIsXG4gICAgICAgICAgICAgICAgcHJvdG9jb2w6IGVsYnYyLlByb3RvY29sLkhUVFAsXG4gICAgICAgICAgICAgICAgaW50ZXJ2YWw6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDYwKSxcbiAgICAgICAgICAgICAgICBwYXRoOlwiL2hlYWx0aGNoZWNrL1wiLFxuICAgICAgICAgICAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDUpLFxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdsb2FkLWJhbGFuY2VyLWRucycsIHsgdmFsdWU6IGxiLmxvYWRCYWxhbmNlckRuc05hbWUsIH0pO1xuICAgIH1cbn0iXX0=