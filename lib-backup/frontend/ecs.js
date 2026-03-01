"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EC2 = void 0;
const cdk = require("aws-cdk-lib");
const aws_cdk_lib_1 = require("aws-cdk-lib");
const constructs_1 = require("constructs");
const aws_ecs_1 = require("aws-cdk-lib/aws-ecs");
class EC2 extends constructs_1.Construct {
    constructor(scope, id, stage, ecr) {
        super(scope, id);
        const vpc = aws_cdk_lib_1.aws_ec2.Vpc.fromLookup(this, 'archimedes-vpc', { vpcName: `${stage}-archimedes-vpc`, });
        const cluster = new aws_cdk_lib_1.aws_ecs.Cluster(this, 'ecs-cluster', { vpc });
        const autoScalingGroup = new aws_cdk_lib_1.aws_autoscaling.AutoScalingGroup(this, 'asg', {
            autoScalingGroupName: `${stage}-archimedes-frontend-asg`,
            vpc,
            instanceType: aws_cdk_lib_1.aws_ec2.InstanceType.of(aws_cdk_lib_1.aws_ec2.InstanceClass.T4G, aws_cdk_lib_1.aws_ec2.InstanceSize.MICRO),
            machineImage: aws_cdk_lib_1.aws_ecs.EcsOptimizedImage.amazonLinux2(aws_ecs_1.AmiHardwareType.ARM),
            desiredCapacity: 1
        });
        const capacityProvider = new aws_cdk_lib_1.aws_ecs.AsgCapacityProvider(this, 'asg-capacity-provider', { autoScalingGroup: autoScalingGroup });
        cluster.addAsgCapacityProvider(capacityProvider);
        // Create a task definition with its own elastic network interface
        const taskDefinition = new aws_cdk_lib_1.aws_ecs.Ec2TaskDefinition(this, 'task-definition', {
            networkMode: aws_cdk_lib_1.aws_ecs.NetworkMode.AWS_VPC,
        });
        // create a task definition with CloudWatch Logs
        const logging = new aws_cdk_lib_1.aws_ecs.AwsLogDriver({ streamPrefix: `${stage}-archimedes-frontend-service-task-definition` });
        const webContainer = taskDefinition.addContainer('task-definition-frontend-container', {
            containerName: `${stage}-archimedes-frontend-container`,
            image: aws_cdk_lib_1.aws_ecs.ContainerImage.fromEcrRepository(ecr.ecr_repository),
            cpu: 100,
            memoryLimitMiB: 256,
            essential: true,
            logging
        });
        webContainer.addPortMappings({
            containerPort: 80,
            hostPort: 80,
            protocol: aws_cdk_lib_1.aws_ecs.Protocol.TCP,
        });
        // Create the service
        const service = new aws_cdk_lib_1.aws_ecs.Ec2Service(this, 'ecs-frontend-service', {
            cluster,
            taskDefinition
        });
        // Create ALB
        const lb = new aws_cdk_lib_1.aws_elasticloadbalancingv2.ApplicationLoadBalancer(this, 'load-balancer', {
            vpc: vpc,
            internetFacing: true,
            loadBalancerName: `${stage}-archimedes-frontend-service`
        });
        const listener = lb.addListener('public-listener', { port: 80, protocol: aws_cdk_lib_1.aws_elasticloadbalancingv2.ApplicationProtocol.HTTP, open: true });
        // Attach ALB to ECS Service
        listener.addTargets('ecs', {
            port: 80,
            protocol: aws_cdk_lib_1.aws_elasticloadbalancingv2.ApplicationProtocol.HTTP,
            targets: [service.loadBalancerTarget({
                    containerName: `${stage}-archimedes-frontend-container`,
                    containerPort: 80
                })],
            // include health check (default is none)
            healthCheck: {
                port: "80",
                protocol: aws_cdk_lib_1.aws_elasticloadbalancingv2.Protocol.HTTP,
                interval: cdk.Duration.seconds(60),
                path: "/health/",
                timeout: cdk.Duration.seconds(5),
            }
        });
        new cdk.CfnOutput(this, 'load-balancer-dns', { value: lb.loadBalancerDnsName, });
    }
}
exports.EC2 = EC2;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWNzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZWNzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLG1DQUFtQztBQUNuQyw2Q0FBa0k7QUFDbEksMkNBQXVDO0FBRXZDLGlEQUFzRDtBQUV0RCxNQUFhLEdBQUksU0FBUSxzQkFBUztJQUM5QixZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQWEsRUFBRSxHQUFRO1FBQzdELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFFakIsTUFBTSxHQUFHLEdBQUcscUJBQUcsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxnQkFBZ0IsRUFBRSxFQUFFLE9BQU8sRUFBRSxHQUFHLEtBQUssaUJBQWlCLEdBQUcsQ0FBQyxDQUFDO1FBRWhHLE1BQU0sT0FBTyxHQUFHLElBQUkscUJBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLGFBQWEsRUFBRSxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUM7UUFFOUQsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLDZCQUFXLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRTtZQUNuRSxvQkFBb0IsRUFBRSxHQUFHLEtBQUssMEJBQTBCO1lBQ3hELEdBQUc7WUFDSCxZQUFZLEVBQUUscUJBQUcsQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDLHFCQUFHLENBQUMsYUFBYSxDQUFDLEdBQUcsRUFBRSxxQkFBRyxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUM7WUFDaEYsWUFBWSxFQUFFLHFCQUFHLENBQUMsaUJBQWlCLENBQUMsWUFBWSxDQUFDLHlCQUFlLENBQUMsR0FBRyxDQUFDO1lBQ3JFLGVBQWUsRUFBRSxDQUFDO1NBQ3JCLENBQUMsQ0FBQztRQUVILE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxxQkFBRyxDQUFDLG1CQUFtQixDQUFDLElBQUksRUFBRSx1QkFBdUIsRUFBRSxFQUFFLGdCQUFnQixFQUFFLGdCQUFnQixFQUFFLENBQUMsQ0FBQztRQUM1SCxPQUFPLENBQUMsc0JBQXNCLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztRQUVqRCxrRUFBa0U7UUFDbEUsTUFBTSxjQUFjLEdBQUcsSUFBSSxxQkFBRyxDQUFDLGlCQUFpQixDQUFDLElBQUksRUFBRSxpQkFBaUIsRUFBRTtZQUN0RSxXQUFXLEVBQUUscUJBQUcsQ0FBQyxXQUFXLENBQUMsT0FBTztTQUN2QyxDQUFDLENBQUM7UUFFQSxnREFBZ0Q7UUFDbkQsTUFBTSxPQUFPLEdBQUcsSUFBSSxxQkFBRyxDQUFDLFlBQVksQ0FBQyxFQUFFLFlBQVksRUFBRSxHQUFHLEtBQUssOENBQThDLEVBQUUsQ0FBQyxDQUFBO1FBRTlHLE1BQU0sWUFBWSxHQUFHLGNBQWMsQ0FBQyxZQUFZLENBQUMsb0NBQW9DLEVBQUU7WUFDbkYsYUFBYSxFQUFFLEdBQUcsS0FBSyxnQ0FBZ0M7WUFDdkQsS0FBSyxFQUFFLHFCQUFHLENBQUMsY0FBYyxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUM7WUFDL0QsR0FBRyxFQUFFLEdBQUc7WUFDUixjQUFjLEVBQUUsR0FBRztZQUNuQixTQUFTLEVBQUUsSUFBSTtZQUNmLE9BQU87U0FDVixDQUFDLENBQUM7UUFFSCxZQUFZLENBQUMsZUFBZSxDQUFDO1lBQ3pCLGFBQWEsRUFBRSxFQUFFO1lBQ2pCLFFBQVEsRUFBRSxFQUFFO1lBQ1osUUFBUSxFQUFFLHFCQUFHLENBQUMsUUFBUSxDQUFDLEdBQUc7U0FDN0IsQ0FBQyxDQUFDO1FBRUgscUJBQXFCO1FBQ3JCLE1BQU0sT0FBTyxHQUFHLElBQUkscUJBQUcsQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLHNCQUFzQixFQUFFO1lBQzdELE9BQU87WUFDUCxjQUFjO1NBQ2pCLENBQUMsQ0FBQztRQUVILGFBQWE7UUFDYixNQUFNLEVBQUUsR0FBRyxJQUFJLHdDQUFLLENBQUMsdUJBQXVCLENBQUMsSUFBSSxFQUFFLGVBQWUsRUFBRTtZQUNoRSxHQUFHLEVBQUUsR0FBRztZQUNSLGNBQWMsRUFBRSxJQUFJO1lBQ3BCLGdCQUFnQixFQUFFLEdBQUcsS0FBSyw4QkFBOEI7U0FDM0QsQ0FBQyxDQUFDO1FBQ0gsTUFBTSxRQUFRLEdBQUcsRUFBRSxDQUFDLFdBQVcsQ0FBQyxpQkFBaUIsRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsUUFBUSxFQUFFLHdDQUFLLENBQUMsbUJBQW1CLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBRXZILDRCQUE0QjtRQUM1QixRQUFRLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRTtZQUN2QixJQUFJLEVBQUUsRUFBRTtZQUNSLFFBQVEsRUFBRSx3Q0FBSyxDQUFDLG1CQUFtQixDQUFDLElBQUk7WUFDeEMsT0FBTyxFQUFFLENBQUMsT0FBTyxDQUFDLGtCQUFrQixDQUFDO29CQUNqQyxhQUFhLEVBQUUsR0FBRyxLQUFLLGdDQUFnQztvQkFDdkQsYUFBYSxFQUFFLEVBQUU7aUJBQ3BCLENBQUMsQ0FBQztZQUNILHlDQUF5QztZQUN6QyxXQUFXLEVBQUU7Z0JBQ1QsSUFBSSxFQUFFLElBQUk7Z0JBQ1YsUUFBUSxFQUFFLHdDQUFLLENBQUMsUUFBUSxDQUFDLElBQUk7Z0JBQzdCLFFBQVEsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7Z0JBQ2xDLElBQUksRUFBQyxVQUFVO2dCQUNmLE9BQU8sRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7YUFDbkM7U0FDSixDQUFDLENBQUM7UUFFSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLG1CQUFtQixFQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUUsQ0FBQyxtQkFBbUIsR0FBRyxDQUFDLENBQUM7SUFDckYsQ0FBQztDQUNKO0FBNUVELGtCQTRFQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBhd3NfZWNzIGFzIGVjcywgYXdzX2VjMiBhcyBlYzIsIGF3c19hdXRvc2NhbGluZyBhcyBhdXRvc2NhbGluZywgYXdzX2VsYXN0aWNsb2FkYmFsYW5jaW5ndjIgYXMgZWxidjIgfSBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcbmltcG9ydCB7IEVDUiB9IGZyb20gJy4vZWNyJztcbmltcG9ydCB7IEFtaUhhcmR3YXJlVHlwZSB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1lY3MnO1xuXG5leHBvcnQgY2xhc3MgRUMyIGV4dGVuZHMgQ29uc3RydWN0IHtcbiAgICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBzdGFnZTogc3RyaW5nLCBlY3I6IEVDUikge1xuICAgICAgICBzdXBlcihzY29wZSwgaWQpO1xuXG4gICAgICAgIGNvbnN0IHZwYyA9IGVjMi5WcGMuZnJvbUxvb2t1cCh0aGlzLCAnYXJjaGltZWRlcy12cGMnLCB7IHZwY05hbWU6IGAke3N0YWdlfS1hcmNoaW1lZGVzLXZwY2AsIH0pO1xuXG4gICAgICAgIGNvbnN0IGNsdXN0ZXIgPSBuZXcgZWNzLkNsdXN0ZXIodGhpcywgJ2Vjcy1jbHVzdGVyJywgeyB2cGMgfSk7XG5cbiAgICAgICAgY29uc3QgYXV0b1NjYWxpbmdHcm91cCA9IG5ldyBhdXRvc2NhbGluZy5BdXRvU2NhbGluZ0dyb3VwKHRoaXMsICdhc2cnLCB7XG4gICAgICAgICAgICBhdXRvU2NhbGluZ0dyb3VwTmFtZTogYCR7c3RhZ2V9LWFyY2hpbWVkZXMtZnJvbnRlbmQtYXNnYCxcbiAgICAgICAgICAgIHZwYyxcbiAgICAgICAgICAgIGluc3RhbmNlVHlwZTogZWMyLkluc3RhbmNlVHlwZS5vZihlYzIuSW5zdGFuY2VDbGFzcy5UNEcsIGVjMi5JbnN0YW5jZVNpemUuTUlDUk8pLFxuICAgICAgICAgICAgbWFjaGluZUltYWdlOiBlY3MuRWNzT3B0aW1pemVkSW1hZ2UuYW1hem9uTGludXgyKEFtaUhhcmR3YXJlVHlwZS5BUk0pLFxuICAgICAgICAgICAgZGVzaXJlZENhcGFjaXR5OiAxXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IGNhcGFjaXR5UHJvdmlkZXIgPSBuZXcgZWNzLkFzZ0NhcGFjaXR5UHJvdmlkZXIodGhpcywgJ2FzZy1jYXBhY2l0eS1wcm92aWRlcicsIHsgYXV0b1NjYWxpbmdHcm91cDogYXV0b1NjYWxpbmdHcm91cCB9KTtcbiAgICAgICAgY2x1c3Rlci5hZGRBc2dDYXBhY2l0eVByb3ZpZGVyKGNhcGFjaXR5UHJvdmlkZXIpO1xuXG4gICAgICAgIC8vIENyZWF0ZSBhIHRhc2sgZGVmaW5pdGlvbiB3aXRoIGl0cyBvd24gZWxhc3RpYyBuZXR3b3JrIGludGVyZmFjZVxuICAgICAgICBjb25zdCB0YXNrRGVmaW5pdGlvbiA9IG5ldyBlY3MuRWMyVGFza0RlZmluaXRpb24odGhpcywgJ3Rhc2stZGVmaW5pdGlvbicsIHtcbiAgICAgICAgICAgIG5ldHdvcmtNb2RlOiBlY3MuTmV0d29ya01vZGUuQVdTX1ZQQyxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgICAgLy8gY3JlYXRlIGEgdGFzayBkZWZpbml0aW9uIHdpdGggQ2xvdWRXYXRjaCBMb2dzXG4gICAgICAgIGNvbnN0IGxvZ2dpbmcgPSBuZXcgZWNzLkF3c0xvZ0RyaXZlcih7IHN0cmVhbVByZWZpeDogYCR7c3RhZ2V9LWFyY2hpbWVkZXMtZnJvbnRlbmQtc2VydmljZS10YXNrLWRlZmluaXRpb25gIH0pXG5cbiAgICAgICAgY29uc3Qgd2ViQ29udGFpbmVyID0gdGFza0RlZmluaXRpb24uYWRkQ29udGFpbmVyKCd0YXNrLWRlZmluaXRpb24tZnJvbnRlbmQtY29udGFpbmVyJywge1xuICAgICAgICAgICAgY29udGFpbmVyTmFtZTogYCR7c3RhZ2V9LWFyY2hpbWVkZXMtZnJvbnRlbmQtY29udGFpbmVyYCxcbiAgICAgICAgICAgIGltYWdlOiBlY3MuQ29udGFpbmVySW1hZ2UuZnJvbUVjclJlcG9zaXRvcnkoZWNyLmVjcl9yZXBvc2l0b3J5KSxcbiAgICAgICAgICAgIGNwdTogMTAwLFxuICAgICAgICAgICAgbWVtb3J5TGltaXRNaUI6IDI1NixcbiAgICAgICAgICAgIGVzc2VudGlhbDogdHJ1ZSxcbiAgICAgICAgICAgIGxvZ2dpbmdcbiAgICAgICAgfSk7XG5cbiAgICAgICAgd2ViQ29udGFpbmVyLmFkZFBvcnRNYXBwaW5ncyh7XG4gICAgICAgICAgICBjb250YWluZXJQb3J0OiA4MCxcbiAgICAgICAgICAgIGhvc3RQb3J0OiA4MCxcbiAgICAgICAgICAgIHByb3RvY29sOiBlY3MuUHJvdG9jb2wuVENQLFxuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIC8vIENyZWF0ZSB0aGUgc2VydmljZVxuICAgICAgICBjb25zdCBzZXJ2aWNlID0gbmV3IGVjcy5FYzJTZXJ2aWNlKHRoaXMsICdlY3MtZnJvbnRlbmQtc2VydmljZScsIHtcbiAgICAgICAgICAgIGNsdXN0ZXIsXG4gICAgICAgICAgICB0YXNrRGVmaW5pdGlvblxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBDcmVhdGUgQUxCXG4gICAgICAgIGNvbnN0IGxiID0gbmV3IGVsYnYyLkFwcGxpY2F0aW9uTG9hZEJhbGFuY2VyKHRoaXMsICdsb2FkLWJhbGFuY2VyJywge1xuICAgICAgICAgICAgdnBjOiB2cGMsXG4gICAgICAgICAgICBpbnRlcm5ldEZhY2luZzogdHJ1ZSxcbiAgICAgICAgICAgIGxvYWRCYWxhbmNlck5hbWU6IGAke3N0YWdlfS1hcmNoaW1lZGVzLWZyb250ZW5kLXNlcnZpY2VgXG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBsaXN0ZW5lciA9IGxiLmFkZExpc3RlbmVyKCdwdWJsaWMtbGlzdGVuZXInLCB7IHBvcnQ6IDgwLCBwcm90b2NvbDogZWxidjIuQXBwbGljYXRpb25Qcm90b2NvbC5IVFRQLCBvcGVuOiB0cnVlIH0pO1xuICAgICAgICAgIFxuICAgICAgICAvLyBBdHRhY2ggQUxCIHRvIEVDUyBTZXJ2aWNlXG4gICAgICAgIGxpc3RlbmVyLmFkZFRhcmdldHMoJ2VjcycsIHtcbiAgICAgICAgICAgIHBvcnQ6IDgwLFxuICAgICAgICAgICAgcHJvdG9jb2w6IGVsYnYyLkFwcGxpY2F0aW9uUHJvdG9jb2wuSFRUUCxcbiAgICAgICAgICAgIHRhcmdldHM6IFtzZXJ2aWNlLmxvYWRCYWxhbmNlclRhcmdldCh7XG4gICAgICAgICAgICAgICAgY29udGFpbmVyTmFtZTogYCR7c3RhZ2V9LWFyY2hpbWVkZXMtZnJvbnRlbmQtY29udGFpbmVyYCxcbiAgICAgICAgICAgICAgICBjb250YWluZXJQb3J0OiA4MFxuICAgICAgICAgICAgfSldLFxuICAgICAgICAgICAgLy8gaW5jbHVkZSBoZWFsdGggY2hlY2sgKGRlZmF1bHQgaXMgbm9uZSlcbiAgICAgICAgICAgIGhlYWx0aENoZWNrOiB7XG4gICAgICAgICAgICAgICAgcG9ydDogXCI4MFwiLFxuICAgICAgICAgICAgICAgIHByb3RvY29sOiBlbGJ2Mi5Qcm90b2NvbC5IVFRQLFxuICAgICAgICAgICAgICAgIGludGVydmFsOiBjZGsuRHVyYXRpb24uc2Vjb25kcyg2MCksXG4gICAgICAgICAgICAgICAgcGF0aDpcIi9oZWFsdGgvXCIsXG4gICAgICAgICAgICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoNSksXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ2xvYWQtYmFsYW5jZXItZG5zJywgeyB2YWx1ZTogbGIubG9hZEJhbGFuY2VyRG5zTmFtZSwgfSk7XG4gICAgfVxufSJdfQ==