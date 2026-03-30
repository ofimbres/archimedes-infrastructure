# archimedes-infrastructure

AWS CDK app for Archimedes: **ArchimedesBackendStack** (Cognito, ECS on EC2, RDS, ALB, ECR), **ArchimedesFrontendStack** (S3 + CloudFront), and **ArchimedesStaticHtmlStack** (miniquiz static hosting). Product and env-var contracts live in the [`docs/shared`](docs/shared) submodule (see `runbooks/aws-dev-deployment.md` and `contracts/backend-contract.md`).

## Deploy the backend stack

1. Configure AWS credentials and default region (`AWS_PROFILE`, `AWS_REGION` or `CDK_DEFAULT_REGION`).
2. Bootstrap once per account/region if needed: `npx cdk bootstrap`.
3. Optional Google sign-in: export `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` before deploy (Cognito Google IdP is only created when both are set).
4. From this directory:

```bash
npm install
npm run build
npx cdk deploy ArchimedesBackendStack
```

CDK deploys **ArchimedesFrontendStack** first (backend Cognito callback URLs use the frontend CloudFront URL). To deploy everything: `npx cdk deploy --all`.

Stack outputs (`UserPoolId`, `BackendUrl`, `DbSecretArn`, `BackendRepositoryUri`, etc.) map to backend runtime env as documented in `docs/shared/contracts/backend-contract.md`.

## Useful commands

- `npm run build` — compile TypeScript
- `npm run watch` — watch and compile
- `npm run test` — Jest tests
- `npx cdk deploy` — deploy (see stacks in `bin/app.ts`)
- `npx cdk diff` — compare with deployed state
- `npx cdk synth` — emit CloudFormation templates

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

CREDENTIALS

## Miniquizzes

Upload miniquizzes to S3 (unzips `data/miniquizzes_2026.zip` then syncs):

```bash
./scripts/upload-miniquizzes.sh
```

https://schoolsdata2-tea-texas.opendata.arcgis.com/