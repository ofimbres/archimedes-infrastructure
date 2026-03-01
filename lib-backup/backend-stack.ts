import * as cdk from 'aws-cdk-lib';
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DynamoDb } from './backend/dynamodb';
import { S3 } from './backend/s3';
import { Cognito } from './backend/cognito';
import { ECR } from './backend/ecr';
import { EC2 } from './backend/ecs';

export interface BackendStackProps extends StackProps {
  stage: string;
}

export class BackendStack extends Stack {
  constructor(scope: Construct, id: string, props: BackendStackProps) {
    super(scope, id, props)

    const dynamodb = new DynamoDb(this, 'dynamodb', props.stage);
    const s3 = new S3(this, 's3', props.stage);
    const cognito = new Cognito(this, 'cognito', props.stage);
    const ecr = new ECR(this, 'ecr', props.stage);
    const ec2 = new EC2(this, 'ec2', props.stage, ecr);
  }
}