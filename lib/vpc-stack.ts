import * as cdk from 'aws-cdk-lib';
import { aws_ec2 as ec2 } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface VpcStackProps extends cdk.StackProps {
  stage: string;
}

export class VpcStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: VpcStackProps) {
    super(scope, id, props)

    const vpc = new ec2.Vpc(this, 'vpc', {
        vpcName: `${props.stage}-archimedes-vpc`,
        maxAzs: 2
    });
  }
}