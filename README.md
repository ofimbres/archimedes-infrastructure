# Welcome to your CDK TypeScript project!

This is a blank project for TypeScript development with CDK.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

 * `npm run build`   compile typescript to js
 * `npm run watch`   watch for changes and compile
 * `npm run test`    perform the jest unit tests
 * `cdk deploy`      deploy this stack to your default AWS account/region
 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emits the synthesized CloudFormation template

https://aws.amazon.com/blogs/developer/recommended-aws-cdk-project-structure-for-python-applications/

cdk
|-- lambda
   |--- cognito_postconfirmation
|-- lib
|   |-- backend-stack.ts
|   |-- frontend-stack.ts
|   |-- constructs
|   |   |-- backend
|   |   |   |-- database.ts
|   |   |   |-- network.ts
|   |   |   |-- containers.ts
|   |   |   |-- authentication.ts
|   |   |   |-- storage.ts
|   |   |-- frontend
|   |   |   |-- static-assets.ts
|   |   |   |-- api-gateway.ts
|   |   |   |-- route53.ts
|   |   |   |-- cloudfront.ts
|-- bin
|   |-- app.ts
|-- package.json
|-- cdk.json