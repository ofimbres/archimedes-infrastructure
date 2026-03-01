import { aws_ecr as ecr } from 'aws-cdk-lib';
import { Construct } from 'constructs';
export declare class ECR extends Construct {
    readonly ecr_repository: ecr.Repository;
    constructor(scope: Construct, id: string, stage: string);
}
