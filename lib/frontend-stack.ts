import * as cdk from 'aws-cdk-lib';
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ECR } from './frontend/ecr';
import { EC2 } from './frontend/ecs';

export interface FrontendStackProps extends StackProps {
  stage: string;
}

export class FrontendStack extends Stack {
  constructor(scope: Construct, id: string, props: FrontendStackProps) {
    super(scope, id, props)

    const ecr = new ECR(this, 'ecr', props.stage);
    const ec2 = new EC2(this, 'ec2', props.stage, ecr);
  }
}