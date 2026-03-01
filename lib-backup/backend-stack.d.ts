import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
export interface BackendStackProps extends StackProps {
    stage: string;
}
export declare class BackendStack extends Stack {
    constructor(scope: Construct, id: string, props: BackendStackProps);
}
