#!/usr/bin/env bash
# One-time: enable IAM DB authentication for a PostgreSQL role on RDS (Path A).
#
# Prerequisites:
#   - aws CLI configured; jq installed
#   - psql (PostgreSQL client) installed (Homebrew: brew install libpq && export PATH="/opt/homebrew/opt/libpq/bin:$PATH")
#   - Network path to RDS (same VPC, VPN, or temporary SG rule for your IP on 5432)
#
# Usage:
#   ./scripts/grant-rds-iam.sh [--iam] [db_role]
#
# Examples:
#   ./scripts/grant-rds-iam.sh postgres                    # first time: password from secret
#   ./scripts/grant-rds-iam.sh --iam postgres              # after GRANT rds_iam (password no longer works)
#   DB_SECRET_ARN=arn:aws:secretsmanager:... ./scripts/grant-rds-iam.sh app_iam
#
# Env (optional):
#   AWS_REGION / AWS_DEFAULT_REGION  (default: us-west-2)
#   DB_SECRET_ARN                   (default: from CloudFormation output DbSecretArn)
#   DB_ENDPOINT                     (RDS hostname if secret JSON has no "host")
#   CDK_STACK_NAME                  (default: ArchimedesBackendStack)

set -euo pipefail

REGION="${AWS_REGION:-${AWS_DEFAULT_REGION:-us-west-2}}"
STACK="${CDK_STACK_NAME:-ArchimedesBackendStack}"

USE_IAM=false
ARGS=()
for arg in "$@"; do
  if [[ "$arg" == "--iam" ]]; then
    USE_IAM=true
  else
    ARGS+=("$arg")
  fi
done
IAM_USER="${ARGS[0]:-postgres}"

if ! [[ "$IAM_USER" =~ ^[a-zA-Z_][a-zA-Z0-9_]*$ ]]; then
  echo "error: db role must be a simple PostgreSQL identifier (letters, digits, underscore)" >&2
  exit 1
fi

command -v aws >/dev/null 2>&1 || { echo "error: aws CLI not found" >&2; exit 1; }
command -v jq >/dev/null 2>&1 || { echo "error: jq not found (brew install jq)" >&2; exit 1; }
command -v psql >/dev/null 2>&1 || { echo "error: psql not found (brew install libpq)" >&2; exit 1; }

SECRET_ARN="${DB_SECRET_ARN:-}"
if [[ -z "$SECRET_ARN" ]]; then
  SECRET_ARN="$(aws cloudformation describe-stacks --stack-name "$STACK" --region "$REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`DbSecretArn`].OutputValue' --output text 2>/dev/null || true)"
fi

if [[ -z "$SECRET_ARN" || "$SECRET_ARN" == "None" ]]; then
  echo "error: set DB_SECRET_ARN or deploy $STACK so DbSecretArn exists" >&2
  exit 1
fi

SECRET_JSON="$(aws secretsmanager get-secret-value --secret-id "$SECRET_ARN" --region "$REGION" \
  --query SecretString --output text)"

export PGHOST="$(echo "$SECRET_JSON" | jq -r .host)"
if [[ -z "$PGHOST" || "$PGHOST" == "null" ]]; then
  PGHOST="${DB_ENDPOINT:-}"
fi
if [[ -z "$PGHOST" || "$PGHOST" == "null" ]]; then
  PGHOST="$(aws cloudformation describe-stacks --stack-name "$STACK" --region "$REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`DbEndpoint`].OutputValue' --output text 2>/dev/null || true)"
fi

export PGPORT="$(echo "$SECRET_JSON" | jq -r .port)"
if [[ -z "$PGPORT" || "$PGPORT" == "null" ]]; then
  PGPORT=5432
fi

export PGUSER="$(echo "$SECRET_JSON" | jq -r .username)"
if [[ -z "$PGUSER" || "$PGUSER" == "null" ]]; then
  PGUSER=postgres
fi

export PGDATABASE="$(echo "$SECRET_JSON" | jq -r .dbname)"
if [[ -z "$PGDATABASE" || "$PGDATABASE" == "null" ]]; then
  PGDATABASE=postgres
fi

if [[ -z "$PGHOST" || "$PGHOST" == "None" ]]; then
  echo "error: no RDS host (secret missing host; set DB_ENDPOINT or fix CloudFormation DbEndpoint access)" >&2
  exit 1
fi

if [[ "$USE_IAM" == true ]]; then
  PGPASSWORD="$(aws rds generate-db-auth-token --hostname "$PGHOST" --port "$PGPORT" --username "$PGUSER" --region "$REGION")"
  export PGPASSWORD
  echo "Using IAM auth to ${PGHOST}:${PGPORT} as ${PGUSER} (database ${PGDATABASE})..."
else
  export PGPASSWORD="$(echo "$SECRET_JSON" | jq -r .password)"
  if [[ -z "$PGPASSWORD" || "$PGPASSWORD" == "null" ]]; then
    echo "error: secret has no password (use --iam if rds_iam is already granted to this user)" >&2
    exit 1
  fi
  echo "Connecting to ${PGHOST}:${PGPORT} as ${PGUSER} (database ${PGDATABASE})..."
fi
echo "Running: GRANT rds_iam TO ${IAM_USER};"

# connect_timeout avoids hanging when RDS is unreachable (e.g. laptop not in VPC / no VPN).
psql "sslmode=require connect_timeout=15" -v ON_ERROR_STOP=1 -c "GRANT rds_iam TO ${IAM_USER};"

echo "Done. IAM principals need rds-db:connect for this DB user (ECS task role + SSM bastion in CDK)."
