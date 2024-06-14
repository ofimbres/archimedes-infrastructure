import * as cdk from 'aws-cdk-lib';
import { aws_iam as iam, aws_s3 as s3,
         aws_lambda as lambda,
         aws_s3_deployment as s3_deployment } from 'aws-cdk-lib';
import { aws_cognito as cognito, Stack, StackProps, CfnOutput, RemovalPolicy } from 'aws-cdk-lib'
import { Construct } from 'constructs';
import * as path from 'path';

export class Cognito extends Construct {
    constructor(scope: Construct, id: string, stage: string) {
      super(scope, id);

    const postConfirmationFn = new lambda.Function(this, 'post-confirmation-function', {
      functionName: `${stage}-archimedes-cognito-post-confirmation`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/cognito_post_confirmation')),
      environment: {
        REGION: 'us-west-2',
        TABLE_NAME: `${stage}-archimedes-table`
      }
    });

    // The code that defines your stack goes here
    const userPool = new cognito.UserPool(this, 'user-pool', {
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
        passwordPolicy: {
          minLength: 8,
          requireDigits: false,
          requireLowercase: false,
          requireSymbols: false,
          requireUppercase: false,
        },
        selfSignUpEnabled: true,
        userVerification: {
          emailSubject: 'Verify your email!',
          emailBody: 'Hello {username}, Thanks for signing up! Your verification code is {####}',
          emailStyle: cognito.VerificationEmailStyle.CODE,
          smsMessage: 'Hello {username}, Thanks for signing up! Your verification code is {####}',
        },
        removalPolicy: RemovalPolicy.RETAIN,
        lambdaTriggers: {
          postConfirmation: postConfirmationFn
        }
      })

      const studentGroup = new cognito.CfnUserPoolGroup(this, "student-group", {
        groupName: "students",
        userPoolId: userPool.userPoolId
      });

      const teacherGroup = new cognito.CfnUserPoolGroup(this, "teacher-group", {
        groupName: "teachers",
        userPoolId: userPool.userPoolId
      });

      const adminGroup = new cognito.CfnUserPoolGroup(this, "admin-group", {
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
  
      new CfnOutput(this, 'userPoolId', {
        value: userPool.userPoolId,
      })
  
      new CfnOutput(this, 'userPoolClientId', {
        value: client.userPoolClientId,
      })
  }
}