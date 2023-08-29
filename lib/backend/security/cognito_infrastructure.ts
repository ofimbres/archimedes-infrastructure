import * as cdk from 'aws-cdk-lib';
import { aws_iam as iam, aws_s3 as s3,
         aws_lambda as lambda,
         aws_s3_deployment as s3_deployment } from 'aws-cdk-lib';
import { aws_cognito as cognito, Stack, StackProps, CfnOutput, RemovalPolicy } from 'aws-cdk-lib'
import { Construct } from 'constructs';
import * as path from 'path';

export class Security extends Construct {
    constructor(scope: Construct, id: string) {
      super(scope, id);

    const postConfirmationFn = new lambda.Function(this, 'postConfirmationFn', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'runtime')),
      environment: {
        REGION: 'us-west-2',
        TABLE_NAME: 'ArchimedesData'
      }
    });

    // The code that defines your stack goes here
    const userPool = new cognito.UserPool(this, 'archimedes-user-pool', {
        userPoolName: 'archimedes-user-pool',
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
          isStudent: new cognito.StringAttribute({ mutable: true }),
          isTeacher: new cognito.StringAttribute({ mutable: true }),
          isAdmin: new cognito.StringAttribute({ mutable: true }),
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
          emailSubject: 'Verify your email for our awesome app!',
          emailBody: 'Hello {username}, Thanks for signing up to our awesome app! Your verification code is {####}',
          emailStyle: cognito.VerificationEmailStyle.CODE,
          smsMessage: 'Hello {username}, Thanks for signing up to our awesome app! Your verification code is {####}',
        },
        removalPolicy: RemovalPolicy.RETAIN,
        lambdaTriggers: {
          postConfirmation: postConfirmationFn
        }
      })
  
      const client = userPool.addClient('app-client')
  
      new CfnOutput(this, 'userPoolId', {
        value: userPool.userPoolId,
      })
  
      new CfnOutput(this, 'userPoolClientId', {
        value: client.userPoolClientId,
      })
  }
}