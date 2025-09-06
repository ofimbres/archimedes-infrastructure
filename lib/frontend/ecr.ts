import * as cdk from 'aws-cdk-lib';
import { aws_ecr as ecr } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class ECR extends Construct {
    public readonly ecr_repository: ecr.Repository;

    constructor(scope: Construct, id: string, stage: string) {
        super(scope, id);   

        this.ecr_repository = new ecr.Repository(this, 'ecr-repository', {
            repositoryName: `${stage}-archimedes-frontend-ecr-repository`,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            emptyOnDelete: true
        });
    }
}