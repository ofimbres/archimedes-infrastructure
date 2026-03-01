"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cognito = void 0;
const aws_cdk_lib_1 = require("aws-cdk-lib");
const constructs_1 = require("constructs");
class Cognito extends constructs_1.Construct {
    constructor(scope, id, stage) {
        super(scope, id);
        // const postConfirmationFn = new lambda.Function(this, 'post-confirmation-function', {
        //   functionName: `${stage}-archimedes-cognito-post-confirmation`,
        //   runtime: lambda.Runtime.NODEJS_20_X,
        //   handler: 'index.handler',
        //   code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/cognito_post_confirmation')),
        //   environment: {
        //     REGION: 'us-west-2',
        //     TABLE_NAME: `${stage}-archimedes-table`
        //   }
        // });
        // The code that defines your stack goes here
        const userPool = new aws_cdk_lib_1.aws_cognito.UserPool(this, 'user-pool', {
            userPoolName: `${stage}-archimedes-user-pool`,
            signInAliases: {
                email: true,
                username: true,
            },
            standardAttributes: {
                //   profilePicture: { mutable: true },
                givenName: { required: true, mutable: true, },
                familyName: { required: true, mutable: true, },
            },
            customAttributes: {
                'custom:userId': new aws_cdk_lib_1.aws_cognito.StringAttribute({ mutable: true }),
            },
            passwordPolicy: {
                minLength: 8,
                requireDigits: false,
                requireLowercase: false,
                requireSymbols: false,
                requireUppercase: false,
            },
            selfSignUpEnabled: true,
            /*userVerification: {
              emailSubject: 'Verify your email!',
              emailBody: 'Hello {username}. Your verification code is {####}',
              emailStyle: cognito.VerificationEmailStyle.CODE,
              smsMessage: 'Hello {username}. Your verification code is {####}',
            },*/
            removalPolicy: aws_cdk_lib_1.RemovalPolicy.RETAIN,
        });
        const studentGroup = new aws_cdk_lib_1.aws_cognito.CfnUserPoolGroup(this, "student-group", {
            groupName: "students",
            userPoolId: userPool.userPoolId
        });
        const teacherGroup = new aws_cdk_lib_1.aws_cognito.CfnUserPoolGroup(this, "teacher-group", {
            groupName: "teachers",
            userPoolId: userPool.userPoolId
        });
        const adminGroup = new aws_cdk_lib_1.aws_cognito.CfnUserPoolGroup(this, "admin-group", {
            groupName: "admins",
            userPoolId: userPool.userPoolId
        });
        const client = userPool.addClient('app-client', {
            authFlows: {
                userPassword: true,
                adminUserPassword: true,
                userSrp: true,
            },
        });
        new aws_cdk_lib_1.CfnOutput(this, 'userPoolId', {
            value: userPool.userPoolId,
        });
        new aws_cdk_lib_1.CfnOutput(this, 'userPoolClientId', {
            value: client.userPoolClientId,
        });
    }
}
exports.Cognito = Cognito;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29nbml0by5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNvZ25pdG8udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBSUEsNkNBQWlHO0FBQ2pHLDJDQUF1QztBQUd2QyxNQUFhLE9BQVEsU0FBUSxzQkFBUztJQUNsQyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQWE7UUFDckQsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztRQUVuQix1RkFBdUY7UUFDdkYsbUVBQW1FO1FBQ25FLHlDQUF5QztRQUN6Qyw4QkFBOEI7UUFDOUIsaUdBQWlHO1FBQ2pHLG1CQUFtQjtRQUNuQiwyQkFBMkI7UUFDM0IsOENBQThDO1FBQzlDLE1BQU07UUFDTixNQUFNO1FBRU4sNkNBQTZDO1FBQzdDLE1BQU0sUUFBUSxHQUFHLElBQUkseUJBQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLFdBQVcsRUFBRTtZQUNyRCxZQUFZLEVBQUUsR0FBRyxLQUFLLHVCQUF1QjtZQUM3QyxhQUFhLEVBQUU7Z0JBQ2IsS0FBSyxFQUFFLElBQUk7Z0JBQ1gsUUFBUSxFQUFFLElBQUk7YUFDZjtZQUNELGtCQUFrQixFQUFFO2dCQUNwQix1Q0FBdUM7Z0JBQ3JDLFNBQVMsRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLElBQUksR0FBRztnQkFDN0MsVUFBVSxFQUFFLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsSUFBSSxHQUFHO2FBQy9DO1lBQ0QsZ0JBQWdCLEVBQUU7Z0JBQ2hCLGVBQWUsRUFBRSxJQUFJLHlCQUFPLENBQUMsZUFBZSxDQUFDLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDO2FBQ2hFO1lBQ0QsY0FBYyxFQUFFO2dCQUNkLFNBQVMsRUFBRSxDQUFDO2dCQUNaLGFBQWEsRUFBRSxLQUFLO2dCQUNwQixnQkFBZ0IsRUFBRSxLQUFLO2dCQUN2QixjQUFjLEVBQUUsS0FBSztnQkFDckIsZ0JBQWdCLEVBQUUsS0FBSzthQUN4QjtZQUNELGlCQUFpQixFQUFFLElBQUk7WUFDdkI7Ozs7O2dCQUtJO1lBQ0osYUFBYSxFQUFFLDJCQUFhLENBQUMsTUFBTTtTQUlwQyxDQUFDLENBQUE7UUFFRixNQUFNLFlBQVksR0FBRyxJQUFJLHlCQUFPLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLGVBQWUsRUFBRTtZQUN2RSxTQUFTLEVBQUUsVUFBVTtZQUNyQixVQUFVLEVBQUUsUUFBUSxDQUFDLFVBQVU7U0FDaEMsQ0FBQyxDQUFDO1FBRUgsTUFBTSxZQUFZLEdBQUcsSUFBSSx5QkFBTyxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxlQUFlLEVBQUU7WUFDdkUsU0FBUyxFQUFFLFVBQVU7WUFDckIsVUFBVSxFQUFFLFFBQVEsQ0FBQyxVQUFVO1NBQ2hDLENBQUMsQ0FBQztRQUVILE1BQU0sVUFBVSxHQUFHLElBQUkseUJBQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsYUFBYSxFQUFFO1lBQ25FLFNBQVMsRUFBRSxRQUFRO1lBQ25CLFVBQVUsRUFBRSxRQUFRLENBQUMsVUFBVTtTQUNoQyxDQUFDLENBQUM7UUFFSCxNQUFNLE1BQU0sR0FBRyxRQUFRLENBQUMsU0FBUyxDQUFDLFlBQVksRUFBRTtZQUM5QyxTQUFTLEVBQUU7Z0JBQ1QsWUFBWSxFQUFFLElBQUk7Z0JBQ2xCLGlCQUFpQixFQUFFLElBQUk7Z0JBQ3ZCLE9BQU8sRUFBRSxJQUFJO2FBQ2Q7U0FDRixDQUFDLENBQUM7UUFFSCxJQUFJLHVCQUFTLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRTtZQUNoQyxLQUFLLEVBQUUsUUFBUSxDQUFDLFVBQVU7U0FDM0IsQ0FBQyxDQUFBO1FBRUYsSUFBSSx1QkFBUyxDQUFDLElBQUksRUFBRSxrQkFBa0IsRUFBRTtZQUN0QyxLQUFLLEVBQUUsTUFBTSxDQUFDLGdCQUFnQjtTQUMvQixDQUFDLENBQUE7SUFDTixDQUFDO0NBQ0Y7QUFqRkQsMEJBaUZDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IGF3c19pYW0gYXMgaWFtLCBhd3NfczMgYXMgczMsXG4gICAgICAgICBhd3NfbGFtYmRhIGFzIGxhbWJkYSxcbiAgICAgICAgIGF3c19zM19kZXBsb3ltZW50IGFzIHMzX2RlcGxveW1lbnQgfSBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBhd3NfY29nbml0byBhcyBjb2duaXRvLCBTdGFjaywgU3RhY2tQcm9wcywgQ2ZuT3V0cHV0LCBSZW1vdmFsUG9saWN5IH0gZnJvbSAnYXdzLWNkay1saWInXG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5cbmV4cG9ydCBjbGFzcyBDb2duaXRvIGV4dGVuZHMgQ29uc3RydWN0IHtcbiAgICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBzdGFnZTogc3RyaW5nKSB7XG4gICAgICBzdXBlcihzY29wZSwgaWQpO1xuXG4gICAgLy8gY29uc3QgcG9zdENvbmZpcm1hdGlvbkZuID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAncG9zdC1jb25maXJtYXRpb24tZnVuY3Rpb24nLCB7XG4gICAgLy8gICBmdW5jdGlvbk5hbWU6IGAke3N0YWdlfS1hcmNoaW1lZGVzLWNvZ25pdG8tcG9zdC1jb25maXJtYXRpb25gLFxuICAgIC8vICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXG4gICAgLy8gICBoYW5kbGVyOiAnaW5kZXguaGFuZGxlcicsXG4gICAgLy8gICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQocGF0aC5qb2luKF9fZGlybmFtZSwgJy4uLy4uL2xhbWJkYS9jb2duaXRvX3Bvc3RfY29uZmlybWF0aW9uJykpLFxuICAgIC8vICAgZW52aXJvbm1lbnQ6IHtcbiAgICAvLyAgICAgUkVHSU9OOiAndXMtd2VzdC0yJyxcbiAgICAvLyAgICAgVEFCTEVfTkFNRTogYCR7c3RhZ2V9LWFyY2hpbWVkZXMtdGFibGVgXG4gICAgLy8gICB9XG4gICAgLy8gfSk7XG5cbiAgICAvLyBUaGUgY29kZSB0aGF0IGRlZmluZXMgeW91ciBzdGFjayBnb2VzIGhlcmVcbiAgICBjb25zdCB1c2VyUG9vbCA9IG5ldyBjb2duaXRvLlVzZXJQb29sKHRoaXMsICd1c2VyLXBvb2wnLCB7XG4gICAgICAgIHVzZXJQb29sTmFtZTogYCR7c3RhZ2V9LWFyY2hpbWVkZXMtdXNlci1wb29sYCxcbiAgICAgICAgc2lnbkluQWxpYXNlczoge1xuICAgICAgICAgIGVtYWlsOiB0cnVlLFxuICAgICAgICAgIHVzZXJuYW1lOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgICBzdGFuZGFyZEF0dHJpYnV0ZXM6IHtcbiAgICAgICAgLy8gICBwcm9maWxlUGljdHVyZTogeyBtdXRhYmxlOiB0cnVlIH0sXG4gICAgICAgICAgZ2l2ZW5OYW1lOiB7IHJlcXVpcmVkOiB0cnVlLCBtdXRhYmxlOiB0cnVlLCB9LFxuICAgICAgICAgIGZhbWlseU5hbWU6IHsgcmVxdWlyZWQ6IHRydWUsIG11dGFibGU6IHRydWUsIH0sXG4gICAgICAgIH0sXG4gICAgICAgIGN1c3RvbUF0dHJpYnV0ZXM6IHtcbiAgICAgICAgICAnY3VzdG9tOnVzZXJJZCc6IG5ldyBjb2duaXRvLlN0cmluZ0F0dHJpYnV0ZSh7IG11dGFibGU6IHRydWUgfSksXG4gICAgICAgIH0sXG4gICAgICAgIHBhc3N3b3JkUG9saWN5OiB7XG4gICAgICAgICAgbWluTGVuZ3RoOiA4LFxuICAgICAgICAgIHJlcXVpcmVEaWdpdHM6IGZhbHNlLFxuICAgICAgICAgIHJlcXVpcmVMb3dlcmNhc2U6IGZhbHNlLFxuICAgICAgICAgIHJlcXVpcmVTeW1ib2xzOiBmYWxzZSxcbiAgICAgICAgICByZXF1aXJlVXBwZXJjYXNlOiBmYWxzZSxcbiAgICAgICAgfSxcbiAgICAgICAgc2VsZlNpZ25VcEVuYWJsZWQ6IHRydWUsXG4gICAgICAgIC8qdXNlclZlcmlmaWNhdGlvbjoge1xuICAgICAgICAgIGVtYWlsU3ViamVjdDogJ1ZlcmlmeSB5b3VyIGVtYWlsIScsXG4gICAgICAgICAgZW1haWxCb2R5OiAnSGVsbG8ge3VzZXJuYW1lfS4gWW91ciB2ZXJpZmljYXRpb24gY29kZSBpcyB7IyMjI30nLFxuICAgICAgICAgIGVtYWlsU3R5bGU6IGNvZ25pdG8uVmVyaWZpY2F0aW9uRW1haWxTdHlsZS5DT0RFLFxuICAgICAgICAgIHNtc01lc3NhZ2U6ICdIZWxsbyB7dXNlcm5hbWV9LiBZb3VyIHZlcmlmaWNhdGlvbiBjb2RlIGlzIHsjIyMjfScsXG4gICAgICAgIH0sKi9cbiAgICAgICAgcmVtb3ZhbFBvbGljeTogUmVtb3ZhbFBvbGljeS5SRVRBSU4sXG4gICAgICAgIC8vIGxhbWJkYVRyaWdnZXJzOiB7XG4gICAgICAgIC8vICAgcG9zdENvbmZpcm1hdGlvbjogcG9zdENvbmZpcm1hdGlvbkZuXG4gICAgICAgIC8vIH1cbiAgICAgIH0pXG5cbiAgICAgIGNvbnN0IHN0dWRlbnRHcm91cCA9IG5ldyBjb2duaXRvLkNmblVzZXJQb29sR3JvdXAodGhpcywgXCJzdHVkZW50LWdyb3VwXCIsIHtcbiAgICAgICAgZ3JvdXBOYW1lOiBcInN0dWRlbnRzXCIsXG4gICAgICAgIHVzZXJQb29sSWQ6IHVzZXJQb29sLnVzZXJQb29sSWRcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCB0ZWFjaGVyR3JvdXAgPSBuZXcgY29nbml0by5DZm5Vc2VyUG9vbEdyb3VwKHRoaXMsIFwidGVhY2hlci1ncm91cFwiLCB7XG4gICAgICAgIGdyb3VwTmFtZTogXCJ0ZWFjaGVyc1wiLFxuICAgICAgICB1c2VyUG9vbElkOiB1c2VyUG9vbC51c2VyUG9vbElkXG4gICAgICB9KTtcblxuICAgICAgY29uc3QgYWRtaW5Hcm91cCA9IG5ldyBjb2duaXRvLkNmblVzZXJQb29sR3JvdXAodGhpcywgXCJhZG1pbi1ncm91cFwiLCB7XG4gICAgICAgIGdyb3VwTmFtZTogXCJhZG1pbnNcIixcbiAgICAgICAgdXNlclBvb2xJZDogdXNlclBvb2wudXNlclBvb2xJZFxuICAgICAgfSk7XG4gIFxuICAgICAgY29uc3QgY2xpZW50ID0gdXNlclBvb2wuYWRkQ2xpZW50KCdhcHAtY2xpZW50Jywge1xuICAgICAgICBhdXRoRmxvd3M6IHtcbiAgICAgICAgICB1c2VyUGFzc3dvcmQ6IHRydWUsXG4gICAgICAgICAgYWRtaW5Vc2VyUGFzc3dvcmQ6IHRydWUsXG4gICAgICAgICAgdXNlclNycDogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICBcbiAgICAgIG5ldyBDZm5PdXRwdXQodGhpcywgJ3VzZXJQb29sSWQnLCB7XG4gICAgICAgIHZhbHVlOiB1c2VyUG9vbC51c2VyUG9vbElkLFxuICAgICAgfSlcbiAgXG4gICAgICBuZXcgQ2ZuT3V0cHV0KHRoaXMsICd1c2VyUG9vbENsaWVudElkJywge1xuICAgICAgICB2YWx1ZTogY2xpZW50LnVzZXJQb29sQ2xpZW50SWQsXG4gICAgICB9KVxuICB9XG59Il19