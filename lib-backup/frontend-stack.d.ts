import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
export interface FrontendStackProps extends StackProps {
    stage: string;
}
export declare class FrontendStack extends Stack {
    constructor(scope: Construct, id: string, props: FrontendStackProps);
}
