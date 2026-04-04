#!/usr/bin/env bash
# One-time: enable IAM DB authentication for a PostgreSQL role on RDS (Path A).
#
# Prerequisites:
#   - aws CLI configured; jq installed
#   - psql (PostgreSQL client) installed (Homebrew: brew install libpq && export PATH="/opt/homebrew/opt/libpq/bin:$PATH")
#   - Network path to RDS (same VPC, VPN, or temporary SG rule for your IP on 5432)
#
# Usage:
#   ./scripts/grant-rds-iam.sh [db_role]
#
# Examples:
#   ./scripts/grant-rds-iam.sh postgres
#   DB_SECRET_ARN=arn:aws:secretsmanager:... ./scripts/grant-rds-iam.sh app_iam
#
# Env (optional):
#   AWS_REGION / AWS_DEFAULT_REGION  (default: us-west-2)
#   DB_SECRET_ARN                   (default: from CloudFormation output DbSecretArn)
#   CDK_STACK_NAME                  (default: ArchimedesBackendStack)

set -euo pipefail

IAM_USER="${1:-postgres}"
REGION="${AWS_REGION:-${AWS_DEFAULT_REGION:-us-west-2}}"
STACK="${CDK_STACK_NAME:-ArchimedesBackendStack}"

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
export PGPORT="$(echo "$SECRET_JSON" | jq -r .port)"
export PGUSER="$(echo "$SECRET_JSON" | jq -r .username)"
export PGPASSWORD="$(echo "$SECRET_JSON" | jq -r .password)"
export PGDATABASE="$(echo "$SECRET_JSON" | jq -r .dbname)"

echo "Connecting to ${PGHOST}:${PGPORT} as ${PGUSER} (database ${PGDATABASE})..."
echo "Running: GRANT rds_iam TO ${IAM_USER};"

# connect_timeout avoids hanging when RDS is unreachable (e.g. laptop not in VPC / no VPN).
psql "sslmode=require connect_timeout=15" -v ON_ERROR_STOP=1 -c "GRANT rds_iam TO ${IAM_USER};"

echo "Done. ECS task role must still have rds-db:connect for this user (CDK grantConnect)."
