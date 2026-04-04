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

### RDS, Secrets Manager, IAM auth, and SSM bastion

After you run **`GRANT rds_iam TO postgres`** (stack output **`DbIamAuthBootstrapSql`**), the **`postgres`** user must use **IAM database authentication** in `psql`, not the Secrets Manager password. See **[docs/rds-bastion-iam-auth.md](docs/rds-bastion-iam-auth.md)** for behavior, bastion IAM permissions, **`scripts/psql-from-db-secret.sh` / `scripts/grant-rds-iam.sh`**, and **cloning this repo on the bastion to run `db/archimedes-schema.sql` and `db/seeds/*.sql`**.

## Backend CI/CD (CodePipeline)

**ArchimedesBackendPipelineStack** mirrors the pattern in `python-comparison/cicd_backend_stack.py`: source → **CodeBuild** (Docker build, push to the **existing** ECR repo from `ArchimedesBackendStack`) → **ECS deploy** to the same **ECS-on-EC2** service. The stack is **optional** and is only synthesized when you set CDK context key **`backendPipeline`**.

### Enable in `cdk.json` (recommended)

Add under `"context"`:

```json
"backendPipeline": {
  "useCodeCommit": true,
  "githubBranch": "main"
}
```

With **`useCodeCommit: true`**, CDK creates a repo named `{STAGE}-archimedes-backend-source` (or set `codeCommitRepositoryName` to an existing repo). Push or mirror your **archimedes-backend** app there; the build expects a `Dockerfile` at the repo root.

### GitHub via CodeStar Connections

Set `useCodeCommit` to `false` or omit it, and set **`githubOwner`**, **`githubRepo`**, and optionally **`githubBranch`** (default `main`). The pipeline stack will appear in `cdk ls` once those are present under `context.backendPipeline`.

- **No `connectionArn`:** CDK creates an `AWS::CodeStarConnections::Connection` (GitHub). After the first deploy, open **Developer Tools → Settings → Connections**, complete **Update pending connection** / authorize GitHub until status is **AVAILABLE**, then run the pipeline. Stack output **`CodeStarConnectionArn`** shows the ARN.
- **Reuse a connection:** set `connectionArn` in `backendPipeline`, or export **`CODESTAR_CONNECTION_ARN`** before `cdk deploy` (merged into context).

Example **CLI** (JSON string context; optional `connectionArn` if you already have one):

```bash
npx cdk deploy ArchimedesBackendPipelineStack -c 'backendPipeline={"githubOwner":"myorg","githubRepo":"archimedes-backend","githubBranch":"dev"}'
```

Set **`requireManualApproval`: true** in `backendPipeline` to add an approval stage before ECS deploy.

Deploy the **backend stack first**, then the pipeline stack: `npx cdk deploy ArchimedesBackendStack` then `npx cdk deploy ArchimedesBackendPipelineStack`.

## GitHub Actions OIDC (no AWS keys in GitHub)

**ArchimedesGithubActionsBackendCicdStack** creates the GitHub OIDC identity provider (unless one already exists—use `existingGitHubOidcProviderArn` in context) and an IAM role GitHub Actions can assume with `aws-actions/configure-aws-credentials`. Configure under **`context.githubActionsCicd`** in `cdk.json` (`githubOrg`, `githubRepo`, optional `githubBranch` for documentation, optional `oidcSubjectPattern` to tighten `sub`).

The role trust allows `repo:{org}/{repo}:*` by default so push, pull request, and `workflow_dispatch` runs can assume the role. After deploy, copy stack output **`GitHubActionsDeployRoleArn`** into GitHub as `role-to-assume` / `AWS_ROLE_ARN` (the IAM role ARN, not the OIDC provider ARN).

In the workflow job that calls `configure-aws-credentials`, set **`permissions: id-token: write`** (and `contents: read` if you use `actions/checkout`).

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