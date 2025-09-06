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
        customAttributes: {
          'custom:userId': new cognito.StringAttribute({ mutable: true }),
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
        removalPolicy: RemovalPolicy.DESTROY,
        // lambdaTriggers: {
        //   postConfirmation: postConfirmationFn
        // }
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