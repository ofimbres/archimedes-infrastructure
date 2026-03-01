# Backend Stack — Cost Overview

The backend stack is set up to keep costs low while still giving you Cognito (with Google) and a place to run your backend app.

## What’s cheap or free

| Resource        | Cost note |
|----------------|-----------|
| **VPC**        | Free. No NAT Gateway (we use `natGateways: 0`), so no ~$32/mo NAT cost. |
| **Cognito**    | Free tier: 50,000 MAU. Above that, pay per MAU. |
| **Custom email Lambda** | Free tier: 1M requests/month; typical usage is tiny. |
| **ECR**        | Free tier: 500 MB storage; then a few $/GB. |

## What has a baseline cost

| Resource   | Rough cost |
|-----------|------------|
| **ECS on EC2** | One t4g.micro instance ~$6–7/mo (ARM). Cheaper than Fargate (~$15–20/mo) for one small backend. |
| **ALB**     | ~$16/mo plus a small amount for LCU usage. |

So **all-in you’re in the ~$22–23/mo range** for one small EC2-backed ECS service behind an ALB, with no NAT Gateway.

## If you need it even cheaper

- **Backend API only, low traffic:** Use **Lambda + API Gateway** instead of ECS. You pay per request and per compute time; at low traffic this can be a few dollars per month.
- **Always-on backend:** The stack uses **ECS on EC2** with one t4g.micro (~$6–7/mo) instead of Fargate for the lowest cost 24/7 container option.

## Summary

- **VPC:** Not expensive; the VPC is free. We avoid NAT Gateway on purpose to save ~$32/mo.
- **ECS on EC2:** One t4g.micro is ~$6–7/mo. For “as cheap as possible” with little traffic, Lambda + API Gateway is the alternative.
