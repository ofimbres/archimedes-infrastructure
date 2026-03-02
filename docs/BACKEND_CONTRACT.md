# Backend contract: what infra provides

This doc describes what **archimedes-infra** exposes to **archimedes-backend**. Use it when working in either repo so env vars, secrets, and stack outputs stay in sync.

**In archimedes-backend:** you can add `docs/INFRA_CONTRACT.md` with a single line: *"Env vars and stack outputs we expect from infra: see archimedes-infra repo `docs/BACKEND_CONTRACT.md`."* Then @-mention that file in Cursor when doing cross-repo work.

**Stacks:** `ArchimedesBackendStack`, `ArchimedesFrontendStack` (app UI), `ArchimedesStaticHtmlStack` (miniquizzes + optional signed URLs).

---

## 1. Backend stack outputs (ArchimedesBackendStack)

After `cdk deploy ArchimedesBackendStack`, the backend app should use these (via env at deploy/runtime or by reading stack outputs in CI).

| Output name | Description | Backend usage |
|-------------|-------------|---------------|
| **UserPoolId** | Cognito User Pool ID | Auth: validate tokens, user lookup (e.g. `COGNITO_USER_POOL_ID`) |
| **UserPoolClientId** | Cognito App Client ID | Auth: token validation, client config (e.g. `COGNITO_CLIENT_ID`) |
| **CognitoDomain** | Hosted UI domain (e.g. `archimedes-dev-123456.auth.us-east-1.amazoncognito.com`) | Auth: JWKS URL, redirects (e.g. `COGNITO_DOMAIN`) |
| **BackendRepositoryUri** | ECR repository URI | CI: push Docker image for backend |
| **BackendUrl** | ALB URL (e.g. `http://...elb.amazonaws.com`) | Frontend / callbacks; add HTTPS in production |
| **DbSecretArn** | Secrets Manager ARN for RDS master (username, password, host, port) | DB: fetch secret at startup to build connection string (e.g. `DB_SECRET_ARN`) |
| **DbEndpoint** | RDS instance endpoint hostname | DB: optional if using secret (secret contains host); or set `DB_HOST` |

**Suggested backend env vars (set from these outputs):**

- `COGNITO_USER_POOL_ID` ← UserPoolId  
- `COGNITO_CLIENT_ID` ← UserPoolClientId  
- `COGNITO_DOMAIN` ← CognitoDomain (or derive JWKS from it)  
- `DB_SECRET_ARN` ← DbSecretArn  
- `DB_HOST` ← DbEndpoint (optional)  
- `BACKEND_URL` or `PUBLIC_URL` ← BackendUrl (for CORS, redirects, etc.)

---

## 2. Static HTML / miniquizzes stack (ArchimedesStaticHtmlStack)

Relevant when the backend serves **signed miniquiz URLs** (paid/sensitive content).

| Output name | Description | Backend usage |
|-------------|-------------|---------------|
| **CloudFrontUrl** | CloudFront distribution URL (e.g. `https://d123.cloudfront.net`) | Base URL for signed miniquiz links (e.g. `CLOUDFRONT_URL`) |
| **S3BucketName** | S3 bucket for miniquiz HTML/assets | If backend needs to list or reference objects |
| **SigningKeyPairId** | CloudFront key pair ID for signed URLs | Only when signed URLs are enabled (e.g. `CLOUDFRONT_KEY_PAIR_ID`) |
| **SigningPrivateKeySecretArn** | Secrets Manager ARN for the signing private key PEM | Only when signed URLs enabled (e.g. `CLOUDFRONT_SIGNING_PRIVATE_KEY_SECRET_ID`) |

**Suggested backend env vars for signed URLs:**

- `CLOUDFRONT_URL` ← CloudFrontUrl  
- `CLOUDFRONT_KEY_PAIR_ID` ← SigningKeyPairId (when using signed URLs)  
- `CLOUDFRONT_SIGNING_PRIVATE_KEY_SECRET_ID` ← SigningPrivateKeySecretArn (backend fetches PEM from Secrets Manager at runtime)

Private key: **do not** put the PEM in env; use Secrets Manager and the ARN above. Helper: `shared/signed-url.ts` in this repo (copy or depend on it in the backend) to build signed URLs.

See [SIGNED_URLS_SETUP.md](./SIGNED_URLS_SETUP.md) for key setup and deploy steps.

---

## 3. App frontend stack (ArchimedesFrontendStack)

S3 + CloudFront for the app UI (HTML, JS, CSS). The frontend calls the **backend ALB** directly; the backend must allow **CORS** from the frontend origin (FrontendUrl below). Cognito callback and logout URLs include the frontend URL so auth redirects work.

| Output name | Description | Frontend / usage |
|-------------|-------------|------------------|
| **FrontendUrl** | CloudFront URL (e.g. `https://d123.cloudfront.net`) | App URL; use as Cognito callback base (already wired in BackendStack). Backend CORS must allow this origin. |
| **FrontendBucketName** | S3 bucket for frontend assets | Deploy built app: `aws s3 sync dist/ s3://<bucket>/` then invalidate CloudFront cache if needed. |
| **DistributionId** | CloudFront distribution ID | Cache invalidation: `aws cloudfront create-invalidation --distribution-id <id> --paths "/*"` |

**Frontend auth (Cognito):** The frontend needs Backend stack outputs to initiate sign-in and request tokens: **UserPoolId**, **UserPoolClientId**, **CognitoDomain**. Inject at build time (e.g. `VITE_COGNITO_USER_POOL_ID`) or serve a small config from the backend. Callback URL for the Hosted UI is `https://<FrontendUrl>/callback` (and root); these are already registered via BackendStack `additionalCallbackUrls` / `additionalLogoutUrls`.

**Backend CORS:** Backend app must send `Access-Control-Allow-Origin: <FrontendUrl>` (or the specific CloudFront origin) and handle preflight for API requests from the browser.

---

## 4. ECR and deployment

- **Image:** Push the backend Docker image to the URI from **BackendRepositoryUri**.
- **Task definition:** The backend stack’s ECS task definition currently uses a placeholder image; your CI or deploy process should update the task definition to use the new image and inject the env vars above (from stack outputs or Parameter Store).

---

## 5. Quick reference: env vars the backend can expect

| Env var | Source stack | Output / note |
|---------|----------------|----------------|
| `COGNITO_USER_POOL_ID` | Backend | UserPoolId |
| `COGNITO_CLIENT_ID` | Backend | UserPoolClientId |
| `COGNITO_DOMAIN` | Backend | CognitoDomain |
| `DB_SECRET_ARN` | Backend | DbSecretArn |
| `DB_HOST` | Backend | DbEndpoint (optional) |
| `CLOUDFRONT_URL` | StaticHtml | CloudFrontUrl |
| `CLOUDFRONT_KEY_PAIR_ID` | StaticHtml | SigningKeyPairId (if signed URLs on) |
| `CLOUDFRONT_SIGNING_PRIVATE_KEY_SECRET_ID` | StaticHtml | SigningPrivateKeySecretArn (if signed URLs on) |

When adding a new output or env in infra, update this file and the backend config so both stay in sync.
