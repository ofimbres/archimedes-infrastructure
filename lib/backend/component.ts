//import * as cdk from "@aws-cdk/core";
//import * as s3 from "@aws-cdk/aws-s3";
//import * as iam from "aws-iam";
import * as cdk from 'aws-cdk-lib';
import { aws_iam as iam, aws_s3 as s3,
         aws_s3_deployment as s3Deployment,
         aws_dynamodb as dynamodb,
         Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Database } from './database/dynamodb_infrastructure';
import { Storage } from './storage/s3_infrastructure';
import { Security } from './security/cognito_infrastructure';

export class BackendStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    const database = new Database(this, "database")
    const storage = new Storage(this, "storage")
    const security = new Security(this, "security")
  }
}