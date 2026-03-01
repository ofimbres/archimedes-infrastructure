"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3 = void 0;
const cdk = require("aws-cdk-lib");
const aws_cdk_lib_1 = require("aws-cdk-lib");
const constructs_1 = require("constructs");
class S3 extends constructs_1.Construct {
    constructor(scope, id, stage) {
        super(scope, id);
        const exerciseresults_bucket = new aws_cdk_lib_1.aws_s3.Bucket(this, 'exercise-results-bucket', {
            bucketName: `${stage}-archmimedes-exercise-results-bucket`,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
            encryption: aws_cdk_lib_1.aws_s3.BucketEncryption.S3_MANAGED,
            blockPublicAccess: aws_cdk_lib_1.aws_s3.BlockPublicAccess.BLOCK_ALL,
            lifecycleRules: [
                {
                    expiration: cdk.Duration.days(365),
                    transitions: [
                        {
                            storageClass: aws_cdk_lib_1.aws_s3.StorageClass.INFREQUENT_ACCESS,
                            transitionAfter: cdk.Duration.days(30),
                        },
                    ],
                },
            ],
        });
        const exercises_bucket = new aws_cdk_lib_1.aws_s3.Bucket(this, 'exercises-bucket', {
            bucketName: `${stage}-archimedes-exercises-bucket`,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
            encryption: aws_cdk_lib_1.aws_s3.BucketEncryption.S3_MANAGED,
            publicReadAccess: true,
            blockPublicAccess: {
                blockPublicAcls: false,
                blockPublicPolicy: false,
                ignorePublicAcls: false,
                restrictPublicBuckets: false,
            },
            websiteIndexDocument: 'index.html',
            lifecycleRules: [
                {
                    expiration: cdk.Duration.days(365),
                    transitions: [
                        {
                            storageClass: aws_cdk_lib_1.aws_s3.StorageClass.INFREQUENT_ACCESS,
                            transitionAfter: cdk.Duration.days(30),
                        },
                    ],
                },
            ],
        });
        // Deploy static code/files into Bucket.
        // new s3_deployment.BucketDeployment(
        //   this,
        //   'deploy-mini-quizz-files',
        //   {
        //     sources: [s3_deployment.Source.asset('./assets/mini-quizzes')],
        //     destinationKeyPrefix: 'mini-quiz',
        //     destinationBucket: exercises_bucket,
        //     memoryLimit: 512,
        //     retainOnDelete: false
        //   }
        // );
    }
}
exports.S3 = S3;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiczMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzMy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtQ0FBbUM7QUFDbkMsNkNBQ2lFO0FBQ2pFLDJDQUF1QztBQUV2QyxNQUFhLEVBQUcsU0FBUSxzQkFBUztJQUM3QixZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQWE7UUFDckQsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztRQUVuQixNQUFNLHNCQUFzQixHQUFHLElBQUksb0JBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLHlCQUF5QixFQUFFO1lBQzFFLFVBQVUsRUFBRSxHQUFHLEtBQUssc0NBQXNDO1lBQzFELGFBQWEsRUFBRSxHQUFHLENBQUMsYUFBYSxDQUFDLE9BQU87WUFDeEMsaUJBQWlCLEVBQUUsSUFBSTtZQUN2QixVQUFVLEVBQUUsb0JBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVO1lBQzFDLGlCQUFpQixFQUFFLG9CQUFFLENBQUMsaUJBQWlCLENBQUMsU0FBUztZQUNqRCxjQUFjLEVBQUU7Z0JBQ2Q7b0JBQ0UsVUFBVSxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQztvQkFDbEMsV0FBVyxFQUFFO3dCQUNYOzRCQUNFLFlBQVksRUFBRSxvQkFBRSxDQUFDLFlBQVksQ0FBQyxpQkFBaUI7NEJBQy9DLGVBQWUsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7eUJBQ3ZDO3FCQUNGO2lCQUNGO2FBQ0Y7U0FDRixDQUFDLENBQUM7UUFFSCxNQUFNLGdCQUFnQixHQUFHLElBQUksb0JBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLGtCQUFrQixFQUFFO1lBQy9ELFVBQVUsRUFBRSxHQUFHLEtBQUssOEJBQThCO1lBQ2xELGFBQWEsRUFBRSxHQUFHLENBQUMsYUFBYSxDQUFDLE9BQU87WUFDeEMsaUJBQWlCLEVBQUUsSUFBSTtZQUN2QixVQUFVLEVBQUUsb0JBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVO1lBQzFDLGdCQUFnQixFQUFFLElBQUk7WUFDdEIsaUJBQWlCLEVBQUU7Z0JBQ2pCLGVBQWUsRUFBRSxLQUFLO2dCQUN0QixpQkFBaUIsRUFBRSxLQUFLO2dCQUN4QixnQkFBZ0IsRUFBRSxLQUFLO2dCQUN2QixxQkFBcUIsRUFBRSxLQUFLO2FBQzdCO1lBQ0Qsb0JBQW9CLEVBQUUsWUFBWTtZQUNsQyxjQUFjLEVBQUU7Z0JBQ2Q7b0JBQ0UsVUFBVSxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQztvQkFDbEMsV0FBVyxFQUFFO3dCQUNYOzRCQUNFLFlBQVksRUFBRSxvQkFBRSxDQUFDLFlBQVksQ0FBQyxpQkFBaUI7NEJBQy9DLGVBQWUsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7eUJBQ3ZDO3FCQUNGO2lCQUNGO2FBQ0Y7U0FDRixDQUFDLENBQUM7UUFFSCx3Q0FBd0M7UUFDeEMsc0NBQXNDO1FBQ3RDLFVBQVU7UUFDViwrQkFBK0I7UUFDL0IsTUFBTTtRQUNOLHNFQUFzRTtRQUN0RSx5Q0FBeUM7UUFDekMsMkNBQTJDO1FBQzNDLHdCQUF3QjtRQUN4Qiw0QkFBNEI7UUFDNUIsTUFBTTtRQUNOLEtBQUs7SUFDVCxDQUFDO0NBQ0Y7QUE5REQsZ0JBOERDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IGF3c19pYW0gYXMgaWFtLCBhd3NfczMgYXMgczMsXG4gICAgICAgICBhd3NfczNfZGVwbG95bWVudCBhcyBzM19kZXBsb3ltZW50IH0gZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5cbmV4cG9ydCBjbGFzcyBTMyBleHRlbmRzIENvbnN0cnVjdCB7XG4gICAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgc3RhZ2U6IHN0cmluZykge1xuICAgICAgc3VwZXIoc2NvcGUsIGlkKTtcblxuICAgIGNvbnN0IGV4ZXJjaXNlcmVzdWx0c19idWNrZXQgPSBuZXcgczMuQnVja2V0KHRoaXMsICdleGVyY2lzZS1yZXN1bHRzLWJ1Y2tldCcsIHtcbiAgICAgICAgYnVja2V0TmFtZTogYCR7c3RhZ2V9LWFyY2htaW1lZGVzLWV4ZXJjaXNlLXJlc3VsdHMtYnVja2V0YCxcbiAgICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSxcbiAgICAgICAgYXV0b0RlbGV0ZU9iamVjdHM6IHRydWUsXG4gICAgICAgIGVuY3J5cHRpb246IHMzLkJ1Y2tldEVuY3J5cHRpb24uUzNfTUFOQUdFRCxcbiAgICAgICAgYmxvY2tQdWJsaWNBY2Nlc3M6IHMzLkJsb2NrUHVibGljQWNjZXNzLkJMT0NLX0FMTCxcbiAgICAgICAgbGlmZWN5Y2xlUnVsZXM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBleHBpcmF0aW9uOiBjZGsuRHVyYXRpb24uZGF5cygzNjUpLFxuICAgICAgICAgICAgdHJhbnNpdGlvbnM6IFtcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHN0b3JhZ2VDbGFzczogczMuU3RvcmFnZUNsYXNzLklORlJFUVVFTlRfQUNDRVNTLFxuICAgICAgICAgICAgICAgIHRyYW5zaXRpb25BZnRlcjogY2RrLkR1cmF0aW9uLmRheXMoMzApLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgfSk7XG4gIFxuICAgICAgY29uc3QgZXhlcmNpc2VzX2J1Y2tldCA9IG5ldyBzMy5CdWNrZXQodGhpcywgJ2V4ZXJjaXNlcy1idWNrZXQnLCB7XG4gICAgICAgIGJ1Y2tldE5hbWU6IGAke3N0YWdlfS1hcmNoaW1lZGVzLWV4ZXJjaXNlcy1idWNrZXRgLFxuICAgICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLFxuICAgICAgICBhdXRvRGVsZXRlT2JqZWN0czogdHJ1ZSxcbiAgICAgICAgZW5jcnlwdGlvbjogczMuQnVja2V0RW5jcnlwdGlvbi5TM19NQU5BR0VELFxuICAgICAgICBwdWJsaWNSZWFkQWNjZXNzOiB0cnVlLFxuICAgICAgICBibG9ja1B1YmxpY0FjY2Vzczoge1xuICAgICAgICAgIGJsb2NrUHVibGljQWNsczogZmFsc2UsXG4gICAgICAgICAgYmxvY2tQdWJsaWNQb2xpY3k6IGZhbHNlLFxuICAgICAgICAgIGlnbm9yZVB1YmxpY0FjbHM6IGZhbHNlLFxuICAgICAgICAgIHJlc3RyaWN0UHVibGljQnVja2V0czogZmFsc2UsXG4gICAgICAgIH0sXG4gICAgICAgIHdlYnNpdGVJbmRleERvY3VtZW50OiAnaW5kZXguaHRtbCcsXG4gICAgICAgIGxpZmVjeWNsZVJ1bGVzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgZXhwaXJhdGlvbjogY2RrLkR1cmF0aW9uLmRheXMoMzY1KSxcbiAgICAgICAgICAgIHRyYW5zaXRpb25zOiBbXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBzdG9yYWdlQ2xhc3M6IHMzLlN0b3JhZ2VDbGFzcy5JTkZSRVFVRU5UX0FDQ0VTUyxcbiAgICAgICAgICAgICAgICB0cmFuc2l0aW9uQWZ0ZXI6IGNkay5EdXJhdGlvbi5kYXlzKDMwKSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgIH0pO1xuICBcbiAgICAgIC8vIERlcGxveSBzdGF0aWMgY29kZS9maWxlcyBpbnRvIEJ1Y2tldC5cbiAgICAgIC8vIG5ldyBzM19kZXBsb3ltZW50LkJ1Y2tldERlcGxveW1lbnQoXG4gICAgICAvLyAgIHRoaXMsXG4gICAgICAvLyAgICdkZXBsb3ktbWluaS1xdWl6ei1maWxlcycsXG4gICAgICAvLyAgIHtcbiAgICAgIC8vICAgICBzb3VyY2VzOiBbczNfZGVwbG95bWVudC5Tb3VyY2UuYXNzZXQoJy4vYXNzZXRzL21pbmktcXVpenplcycpXSxcbiAgICAgIC8vICAgICBkZXN0aW5hdGlvbktleVByZWZpeDogJ21pbmktcXVpeicsXG4gICAgICAvLyAgICAgZGVzdGluYXRpb25CdWNrZXQ6IGV4ZXJjaXNlc19idWNrZXQsXG4gICAgICAvLyAgICAgbWVtb3J5TGltaXQ6IDUxMixcbiAgICAgIC8vICAgICByZXRhaW5PbkRlbGV0ZTogZmFsc2VcbiAgICAgIC8vICAgfVxuICAgICAgLy8gKTtcbiAgfVxufSJdfQ==