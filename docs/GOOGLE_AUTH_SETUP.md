# Google authentication setup

The backend stack uses **AWS Cognito** with **Google** as an optional identity provider. If you don’t set Google credentials, the stack still deploys; only email/password (and custom verification) work. To enable “Sign in with Google,” follow these steps.

**Attributes from Google:** The stack maps email, name (given/family), **profile picture**, **phone number**, and **gender** from Google into Cognito user attributes when available. Picture is provided by the standard `profile` scope. Gender may be in Google’s userinfo. Phone number often requires additional Google scopes (e.g. People API) and may not be present for all users.

---

## 1. Create OAuth credentials in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/) and create or select a project.
2. Open **APIs & Services** → **Credentials**.
3. Click **Create credentials** → **OAuth client ID**.
4. If prompted, configure the **OAuth consent screen** first:
   - User type: **External** (or Internal for a workspace-only app).
   - Fill in App name, User support email, Developer contact.
   - Under **Scopes**, add `.../auth/userinfo.email` and `.../auth/userinfo.profile` (or rely on the default OpenID scopes).
   - Under **Authorized domains**, add: **`amazoncognito.com`** (required for Cognito; without this you may see “Access blocked: This app’s request is invalid”).
5. Back in **Credentials**, create the OAuth client:
   - Application type: **Web application** (not Desktop, Android, etc.).
   - Name: e.g. `Archimedes Cognito`.
   - **Authorized redirect URIs**: add exactly (see next section for your value):
     ```
     https://<YOUR_COGNITO_DOMAIN>/oauth2/idpresponse
     ```
     Replace `<YOUR_COGNITO_DOMAIN>` with your full Cognito host (e.g. `archimedes-dev-928483661641.auth.us-west-2.amazoncognito.com`). No trailing slash; must be exact or Google will reject the request.
   - **Authorized JavaScript origins** (if required): `https://<YOUR_COGNITO_DOMAIN>`.
6. Copy the **Client ID** and **Client secret**. You can download the JSON (e.g. `client_secret_<id>.apps.googleusercontent.com.json`); keep it out of git (see “Deploy using the JSON file” below).

---

## 2. Get your Cognito domain

The redirect URI in Google must use your Cognito hosted UI domain. You can get it in one of these ways:

- **After first deploy (without Google):** Deploy the backend stack once, then read the **CognitoDomain** stack output. The output may be just the prefix (e.g. `archimedes-dev-928483661641`); the full domain is then `https://<prefix>.auth.<region>.amazoncognito.com`.
- **Before deploy:** The full domain is `archimedes-<stage>-<account>.auth.<region>.amazoncognito.com`, with:
  - `<stage>` = value of `STAGE` (default `dev`)
  - `<account>` = your AWS account ID (e.g. `aws sts get-caller-identity --query Account --output text`)
  - `<region>` = the region you deploy to (e.g. `us-west-2`)

**Authorized redirect URI** to add in Google (one line, no trailing slash):

```
https://archimedes-<stage>-<account>.auth.<region>.amazoncognito.com/oauth2/idpresponse
```

Example: `https://archimedes-dev-928483661641.auth.us-west-2.amazoncognito.com/oauth2/idpresponse`

---

## 3. Provide credentials when deploying

Pass the Google client ID and secret to CDK so Cognito can use Google as an IdP. **Do not commit these values.** The repo ignores `client_secret_*.json` via `.gitignore`.

**Option A – Deploy using the JSON file (convenient):**

If you have the Google client secret JSON in the project root (Google names it like `client_secret_<id>.apps.googleusercontent.com.json`):

```bash
export GOOGLE_CLIENT_ID=$(jq -r '.web.client_id' client_secret_<your-file>.apps.googleusercontent.com.json)
export GOOGLE_CLIENT_SECRET=$(jq -r '.web.client_secret' client_secret_<your-file>.apps.googleusercontent.com.json)
cdk deploy ArchimedesBackendStack --require-approval never
```

Replace `client_secret_<your-file>.apps.googleusercontent.com.json` with your actual downloaded filename.

**Option B – Environment variables only:**

```bash
export GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
export GOOGLE_CLIENT_SECRET="your-google-client-secret"
cdk deploy ArchimedesBackendStack
```

**Option C – CDK context / app:**

You can also pass `googleClientId` and `googleClientSecret` via `cdk.json` context or by changing `bin/app.ts` to read from another source (e.g. AWS Secrets Manager). Prefer env vars or a secrets manager over committing secrets.

---

## 4. Test Google sign-in

After deploying, open the Cognito Hosted UI with your app client ID (from stack output **UserPoolClientId**). Example (replace `COGNITO_DOMAIN` and `CLIENT_ID` with your values):

```
https://<COGNITO_DOMAIN>.auth.<REGION>.amazoncognito.com/login?client_id=<CLIENT_ID>&response_type=code&scope=openid+email+profile&redirect_uri=http://localhost:3000/callback
```

You should see the Cognito login page with a **Google** button. After signing in with Google, Cognito redirects to `http://localhost:3000/callback?code=...`. If nothing is running on port 3000, the page will fail to load but the redirect confirms the flow works. To see the callback, run a local server (e.g. `npx serve -l 3000`) and try again.

---

## 5. Add production callback URLs (optional)

The stack allows these Cognito callback URLs by default:

- `http://localhost:3000/callback`
- `https://localhost:3000/callback`

For production, add your frontend URLs to the Cognito app client’s **callback URLs** and **logout URLs** in `lib/backend-stack.ts`, then redeploy.

---

## Troubleshooting

### “Access blocked: This app’s request is invalid”

Usually caused by Google rejecting the OAuth request. Check:

| Check | Where | What to do |
|-------|--------|------------|
| **Redirect URI exact match** | Credentials → your Web client → Authorized redirect URIs | Use exactly `https://<CognitoDomain>/oauth2/idpresponse` (no trailing slash, correct domain). |
| **Authorized domains** | OAuth consent screen → Authorized domains | Add **`amazoncognito.com`**. |
| **Test users (Testing mode)** | OAuth consent screen → Test users | If the app is in **Testing**, add your Google account as a test user; only they can sign in. |
| **Application type** | Credentials → your client | Must be **Web application**, not Desktop or Android. |
| **Correct client** | Credentials | Ensure the client you edited is the one whose ID/secret you deployed (e.g. the one in your `client_secret_*.json`). |

After changing settings in Google Cloud Console, wait a minute and try again.

### “redirect_uri_mismatch”

The redirect URI in Google must match exactly what Cognito sends: `https://<CognitoDomain>/oauth2/idpresponse`. Copy the value from the stack output (or build it as in section 2) and paste it into **Authorized redirect URIs** with no extra characters.

---

## Summary checklist

- [ ] Create a Google Cloud project and OAuth consent screen; add **`amazoncognito.com`** to Authorized domains.
- [ ] Create OAuth client (**Web application**) and set **Authorized redirect URI** to `https://<CognitoDomain>/oauth2/idpresponse` (exact).
- [ ] If consent screen is in **Testing**, add your Google account under Test users.
- [ ] Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` (env or from JSON) and deploy `ArchimedesBackendStack`.
- [ ] (Optional) Add production callback/logout URLs in `lib/backend-stack.ts` and redeploy.
