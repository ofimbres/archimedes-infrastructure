import { Construct } from 'constructs';
import { ECR } from './ecr';
export declare class EC2 extends Construct {
    constructor(scope: Construct, id: string, stage: string, ecr: ECR);
}
