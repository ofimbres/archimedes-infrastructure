# Signed URLs for Miniquizzes (paid/sensitive content)

Miniquizzes are served from S3 via CloudFront. When a signing public key is configured, **only signed URLs** can access the content. Your backend issues short-lived signed URLs after validating the user (e.g. paid, logged in).

## 1. Generate an RSA key pair

```bash
# Private key (keep secret; store in backend env or Secrets Manager)
openssl genrsa -out cloudfront_signing_private_key.pem 2048

# Public key (upload to CloudFront via CDK)
openssl rsa -pubout -in cloudfront_signing_private_key.pem -out cloudfront_signing_public_key.pem
```

## 2. Deploy the stack with the public key

Set the **entire PEM contents** of the public key (including `-----BEGIN PUBLIC KEY-----` and `-----END PUBLIC KEY-----`) as an environment variable, then deploy:

```bash
export CLOUDFRONT_SIGNING_PUBLIC_KEY_PEM="$(cat cloudfront_signing_public_key.pem)"
cdk deploy ArchimedesStaticHtmlStack
```

Or use CDK context in `cdk.json` and pass it via props in `bin/app.ts` instead of `process.env.CLOUDFRONT_SIGNING_PUBLIC_KEY_PEM`.

After deploy, note the stack outputs **SigningKeyPairId** (only when signed URLs are enabled) and **SigningPrivateKeySecretArn**. The backend needs the Key Pair ID and the secret ARN to build signed URLs.

### Store the private key in Secrets Manager (one-time)

The stack **always** creates a secret named **`archimedes/cloudfront-signing-private-key`** with a placeholder value, so you can deploy once and then set the private key. After deploy:

1. Open **AWS Console → Secrets Manager** and find the secret `archimedes/cloudfront-signing-private-key`.
2. Choose **Retrieve secret value** → **Edit**.
3. Replace the placeholder with the **full contents** of your private key PEM file (the same key pair you used to generate the public key).
4. Save.

Alternatively, from the **project root** (where your `.pem` file is), use the CLI:

```bash
aws secretsmanager put-secret-value \
  --secret-id archimedes/cloudfront-signing-private-key \
  --secret-string file://cloudfront_signing_private_key.pem
```

Your backend then uses the stack output **SigningPrivateKeySecretArn** (or the secret name) as `CLOUDFRONT_SIGNING_PRIVATE_KEY_SECRET_ID` and fetches the value at runtime. The private key never needs to be in env vars or in code.

## 3. Backend: issue signed URLs

Use the helper in this repo: **`shared/signed-url.ts`**. Import it from your backend (same repo) or copy the file into your backend project.

**Inputs:**

- **Key Pair ID**: from stack output `SigningKeyPairId`
- **Distribution URL**: from stack output `CloudFrontUrl` (e.g. `https://d123abc.cloudfront.net`, no trailing slash)
- **Private key**: from env var or Secrets Manager (see below); never expose to the frontend
- **Path**: object key (e.g. `AL01.html` or `miniquizzes/AL01.html`)
- **Expiry**: e.g. `3600` (1 hour)

**Flow:**

1. User requests a worksheet (e.g. `AL01.html`).
2. Backend checks auth/entitlement (e.g. paid, subscription).
3. Backend calls `createMiniquizSignedUrl(...)` and returns the signed URL to the frontend.
4. Frontend uses that URL in an iframe or link; when it expires, the frontend requests a new signed URL from the backend.

**Example (env var for private key):**

```ts
import { createMiniquizSignedUrl } from '../shared/signed-url';

const signedUrl = createMiniquizSignedUrl({
  keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID!,
  distributionUrl: process.env.CLOUDFRONT_URL!, // e.g. https://d123abc.cloudfront.net
  privateKeyPem: process.env.CLOUDFRONT_SIGNING_PRIVATE_KEY_PEM!,
  path: 'AL01.html',
  expirySeconds: 3600,
});
// Return signedUrl to the client
```

**Example (private key from Secrets Manager — recommended):**

The stack creates the secret; you only replace its value with your PEM (see above). In your backend, set `CLOUDFRONT_SIGNING_PRIVATE_KEY_SECRET_ID` to the stack output **SigningPrivateKeySecretArn** (or use the secret name `archimedes/cloudfront-signing-private-key`):

```ts
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { createMiniquizSignedUrl } from '../shared/signed-url';

const client = new SecretsManagerClient({});
const { SecretString: privateKeyPem } = await client.send(
  new GetSecretValueCommand({ SecretId: process.env.CLOUDFRONT_SIGNING_PRIVATE_KEY_SECRET_ID })
);

const signedUrl = createMiniquizSignedUrl({
  keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID!,
  distributionUrl: process.env.CLOUDFRONT_URL!,
  privateKeyPem: privateKeyPem!,
  path: 'AL01.html',
  expirySeconds: 3600,
});
```

**Multiple paths:** use `createMiniquizSignedUrls({ ...params, paths: ['AL01.html', 'AN01.html'] })` to get a map of path → signed URL.

## 4. Without a public key (dev only)

If `CLOUDFRONT_SIGNING_PUBLIC_KEY_PEM` is not set, the stack deploys **without** signed URL requirement: anyone with the CloudFront URL can access objects. Use this only for development; for paid/sensitive worksheets always set the public key in production.
