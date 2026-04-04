#!/usr/bin/env bash
# Connect to RDS Postgres using credentials from DbSecretArn + stack outputs.
#
# IMPORTANT (AWS PostgreSQL + IAM):
# If you ran GRANT rds_iam TO postgres (stack output DbIamAuthBootstrapSql), AWS requires IAM
# authentication for that user — the Secrets Manager password NO LONGER works and psql fails
# with "PAM authentication failed". Use --iam (needs bastion role rds-db:connect; redeploy stack).
#
# Usage:
#   ./scripts/psql-from-db-secret.sh              # password from secret (only if rds_iam not granted)
#   ./scripts/psql-from-db-secret.sh --iam        # IAM auth token (required after GRANT rds_iam TO postgres)
#   ./scripts/psql-from-db-secret.sh --iam -c 'SELECT 1'
#
# Env (optional):
#   PSQL_AUTH=password|iam         (same as --password / --iam)
#   AWS_REGION / AWS_DEFAULT_REGION
#   DB_SECRET_ARN, DB_ENDPOINT, CDK_STACK_NAME

set -euo pipefail

REGION="${AWS_REGION:-${AWS_DEFAULT_REGION:-us-west-2}}"
STACK="${CDK_STACK_NAME:-ArchimedesBackendStack}"

AUTH="${PSQL_AUTH:-password}"
PSQL_ARGS=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --iam)
      AUTH=iam
      shift
      ;;
    --password)
      AUTH=password
      shift
      ;;
    *)
      PSQL_ARGS+=("$1")
      shift
      ;;
  esac
done

command -v aws >/dev/null 2>&1 || { echo "error: aws CLI not found" >&2; exit 1; }
command -v jq >/dev/null 2>&1 || { echo "error: jq not found" >&2; exit 1; }
command -v psql >/dev/null 2>&1 || { echo "error: psql not found (on AL2023: dnf install -y postgresql15)" >&2; exit 1; }

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

DBNAME="$(echo "$SECRET_JSON" | jq -r .dbname)"
if [[ -z "$DBNAME" || "$DBNAME" == "null" ]]; then
  DBNAME=postgres
fi
export PGDATABASE="$DBNAME"
export PGSSLMODE=require

if [[ -z "$PGHOST" || "$PGHOST" == "None" ]]; then
  echo "error: no RDS host (set DB_ENDPOINT or ensure stack exports DbEndpoint)" >&2
  exit 1
fi

if [[ "$AUTH" == "iam" ]]; then
  PGPASSWORD="$(aws rds generate-db-auth-token --hostname "$PGHOST" --port "$PGPORT" --username "$PGUSER" --region "$REGION")"
  export PGPASSWORD
  echo "Using IAM DB authentication as ${PGUSER}@${PGHOST}:${PGPORT} (database ${PGDATABASE})" >&2
else
  export PGPASSWORD="$(echo "$SECRET_JSON" | jq -r .password)"
  if [[ -z "$PGPASSWORD" || "$PGPASSWORD" == "null" ]]; then
    echo "error: secret has no password; raw keys:" >&2
    echo "$SECRET_JSON" | jq 'keys' >&2
    exit 1
  fi
  echo "Using Secrets Manager password as ${PGUSER}@${PGHOST}:${PGPORT} (database ${PGDATABASE})" >&2
  echo "If you see PAM authentication failed and you ran GRANT rds_iam TO postgres, use: $0 --iam ..." >&2
fi

exec psql "sslmode=require connect_timeout=15" "${PSQL_ARGS[@]}"
