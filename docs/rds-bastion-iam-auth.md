# RDS credentials, IAM database auth, and the SSM bastion

This document explains how **ArchimedesBackendStack** wires Postgres credentials, why **`psql` with the Secrets Manager password** can fail after bootstrap, and how to connect from the **SSM bastion** using **IAM authentication**.

Official reference: [IAM database authentication for PostgreSQL on Amazon RDS](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.IAMDBAuth.html).

---

## What the stack creates

### Master user password (RDS-managed)

The RDS instance uses **`ManageMasterUserPassword: true`**. AWS generates the master user password and stores it in Secrets Manager in a secret whose name looks like **`rds!db-...`**. The CloudFormation output **`DbSecretArn`** is that secret’s ARN.

That secret always contains at least **`username`** and **`password`**. It may or may not include **`host`** / **`port`** / **`dbname`**; our helper scripts fall back to stack output **`DbEndpoint`** and default **5432** when needed.

### IAM database authentication (instance + app)

The database has **`IAMDatabaseAuthentication` enabled**. The ECS task is configured for IAM DB auth: it does **not** use the static secret password at runtime; it uses an IAM identity plus a short-lived token (see product contract in `docs/shared` if linked from backend env docs).

Stack output **`DbIamAuthBootstrapSql`** is:

```sql
GRANT rds_iam TO postgres;
```

You run that **once**, as a superuser, so the **`postgres`** role is allowed to authenticate with IAM tokens (same user the app uses via `DB_IAM_USER` from the secret’s username field).

---

## Critical AWS behavior (why password `psql` broke)

For **PostgreSQL on RDS**, AWS documents:

> If the IAM role **`rds_iam`** is added to a user **(including the RDS master user)**, **IAM authentication takes precedence over password authentication**, so **the user must log in using IAM authentication**.

So **after** you run **`GRANT rds_iam TO postgres`**:

- The **`postgres`** user **must** connect with an **IAM auth token** (presented as the “password” on the wire), **not** with the string stored under **`password`** in Secrets Manager.
- Trying the secret password in `psql` typically fails with something like **`FATAL: PAM authentication failed for user "postgres"`**. That message is misleading; it is effectively “this user is not accepting password auth anymore.”

The Secrets Manager password is still real for RDS (rotation, console workflows, etc.), but **for `postgres` after `rds_iam`**, interactive clients should use **IAM**, not that password.

---

## Bastion IAM permissions

When **`enableSsmBastion`** is enabled in CDK context, the bastion instance role can:

| Need | Why |
|------|-----|
| **`secretsmanager:GetSecretValue`** (and describe) on **`DbSecretArn`** | Read JSON for **username** (and optional host/dbname); not used as password after IAM bootstrap for `postgres`. |
| **`cloudformation:DescribeStacks`** on this stack | Resolve **`DbSecretArn`** / **`DbEndpoint`** without hard-coding ARNs. |
| **`rds-db:connect`** for **`postgres`** on this DB instance | Required so **IAM tokens** generated on the bastion are accepted by RDS (see `grantConnect` in `lib/backend-stack.ts`). |

After CDK changes the bastion role, **start a new SSM session** so the instance picks up the updated instance profile.

---

## Scripts in this repo

### `scripts/psql-from-db-secret.sh`

- **`--iam`** (or **`PSQL_AUTH=iam`**): sets **`PGPASSWORD`** from **`aws rds generate-db-auth-token`**, uses **SSL**, connects with **`PGUSER`** from the secret (usually **`postgres`**). **Use this after `GRANT rds_iam TO postgres`.**
- **`--password`** (default): uses the secret’s **`password`**. Only works for **`postgres`** if **`rds_iam` has not** been granted to that user (or you are connecting as a different DB role without `rds_iam`).

Examples:

```bash
chmod +x scripts/psql-from-db-secret.sh

# Normal path on bastion after IAM bootstrap:
./scripts/psql-from-db-secret.sh --iam

./scripts/psql-from-db-secret.sh --iam -c 'SELECT current_user, current_database();'
```

### `scripts/grant-rds-iam.sh`

- **First run** (before `postgres` has `rds_iam`): use **password** from the secret (default) to connect and run **`GRANT rds_iam TO <role>;`**.
- **Later** (if `postgres` already has `rds_iam`): use **`--iam`** so the script connects with a token instead of the secret password.

```bash
./scripts/grant-rds-iam.sh postgres              # first time
./scripts/grant-rds-iam.sh --iam postgres        # after IAM is already enabled for that user
```

---

## Connecting from the bastion (checklist)

1. SSM in: **`aws ssm start-session --target <SsmBastionInstanceId>`** (from stack output).
2. Install tools (Amazon Linux 2023 example): **`sudo dnf install -y postgresql15 jq`**.
3. Ensure AWS CLI v2 is available (Session Manager AMIs usually have it).
4. Run **`./scripts/psql-from-db-secret.sh --iam`** (copy script onto the host or clone the repo).

---

## Optional: restore password-only login for `postgres`

If you **revoke** IAM from the master role:

```sql
REVOKE rds_iam FROM postgres;
```

then **password** auth with the Secrets Manager password can work again in `psql`—but the **ECS app** path that relies on IAM DB auth for **`postgres`** will **stop working** until you align app auth with that change. Prefer a **separate DB user** for human admin if you need both patterns.

---

## Troubleshooting

| Symptom | Likely cause |
|--------|----------------|
| **`PAM authentication failed`** as **`postgres`** with secret password | **`GRANT rds_iam TO postgres`** already applied; use **`--iam`** or revoke `rds_iam` (see above). |
| IAM path fails with **access denied** on AWS side | Bastion role missing **`rds-db:connect`**; redeploy stack and **new SSM session**. |
| **`secret has no host`** | Normal for **`rds!db-...`** secrets; scripts use **`DbEndpoint`** / **`DB_ENDPOINT`**. |
| Token / connection issues | IAM tokens expire in **~15 minutes**; regenerate. **SSL** is required for IAM auth (`sslmode=require` in scripts). |

---

## CDK source of truth

- **`lib/backend-stack.ts`**: RDS **`manageMasterUserPassword`**, **`iamAuthentication`**, bastion **`grantRead`** on master secret, **`grantConnect(bastion, 'postgres')`**, ECS task IAM wiring, outputs **`DbSecretArn`**, **`DbEndpoint`**, **`DbIamAuthBootstrapSql`**, **`SsmBastionInstanceId`**.

---

## Clone this repo on the bastion and load `db/*.sql`

Use this when you want **schema + seed data** on the RDS database the stack created (**`archimedes`**, from `databaseName` in CDK).

### 1. Open a session and install tools

```bash
# From your laptop (use stack output SsmBastionInstanceId)
aws ssm start-session --target <instance-id>

# On the bastion (Amazon Linux 2023)
sudo dnf install -y git jq postgresql15
```

Ensure **`AWS_REGION`** matches the stack (e.g. **`export AWS_DEFAULT_REGION=us-west-2`**). The instance profile supplies credentials for Secrets Manager, CloudFormation, and **`rds generate-db-auth-token`**.

### 2. Clone the GitHub repo

**Public repository**

```bash
cd ~
git clone https://github.com/<org>/archimedes-infrastructure.git
cd archimedes-infrastructure
```

**Private repository**

The bastion has no browser for GitHub OAuth. Typical options:

- **HTTPS + personal access token (PAT)** (fine-grained or classic `repo` scope), one-shot:

  ```bash
  git clone https://<YOUR_GITHUB_TOKEN>@github.com/<org>/archimedes-infrastructure.git
  ```

  Prefer **`GIT_ASKPASS`** or **`gh auth login`** with a token stored outside shell history instead of embedding the token in the URL when possible.

- **Deploy key** (read-only SSH key added to that repo): install the private key on the bastion (e.g. under `/home/ssm-user/.ssh/`) and `git clone git@github.com:<org>/archimedes-infrastructure.git`.

**Submodule `docs/shared`**

This repo declares a submodule at **`docs/shared`**. You **do not** need it to run **`db/archimedes-schema.sql`** or **`db/seeds/*.sql`**. If a plain `git clone` leaves `docs/shared` empty, that is OK for database work.

To pull submodule content (optional):

```bash
git submodule update --init --recursive
```

(Requires GitHub access to the submodule remote as well.)

### 3. Run SQL against database `archimedes`

Use **`--iam`** and target the app database (**`-d archimedes`**). Each invocation of **`scripts/psql-from-db-secret.sh`** builds a **new** IAM auth token (~15 minute lifetime).

```bash
chmod +x scripts/psql-from-db-secret.sh
cd ~/archimedes-infrastructure   # or wherever you cloned

# 1) DDL — run once on an empty database; re-running fails on existing tables unless you drop them first
./scripts/psql-from-db-secret.sh --iam -v ON_ERROR_STOP=1 -d archimedes -f db/archimedes-schema.sql

# 2) Seeds (idempotent upserts — safe to re-run)
./scripts/psql-from-db-secret.sh --iam -v ON_ERROR_STOP=1 -d archimedes -f db/seeds/schools.sql

# 3) Topics + subtopics (optional if you use the full activities file below)
./scripts/psql-from-db-secret.sh --iam -v ON_ERROR_STOP=1 -d archimedes -f db/seeds/topics.sql

# 4) Activities (large file; already includes topic/subtopic inserts at the top — you can skip topics.sql if you only run this)
./scripts/psql-from-db-secret.sh --iam -v ON_ERROR_STOP=1 -d archimedes -f db/seeds/activities.sql
```

**Recommended minimal path** if you want one topics+activities payload: **`archimedes-schema.sql`** → **`schools.sql`** → **`activities.sql`** (skip **`topics.sql`** when using the full **`activities.sql`**).

**`ON_ERROR_STOP=1`** makes **`psql`** exit non-zero on the first SQL error so you do not silently continue after a failure.

### 4. One-time IAM bootstrap on the DB

If you have not already run **`GRANT rds_iam TO postgres`** from an admin session, do that **before** relying on **`--iam`** (see earlier sections and **`scripts/grant-rds-iam.sh`**).

### 5. Alternatives without cloning

- **Copy files**: from your laptop, **`scp`** / **`aws ssm send-command`** / paste into an editor on the bastion — then run **`psql ... -f`** against those paths.
- **Raw `psql`**: set **`PGPASSWORD="$(aws rds generate-db-auth-token ...)"`** and **`sslmode=require`** as in the main doc; pass **`-d archimedes -f path`** the same way.
