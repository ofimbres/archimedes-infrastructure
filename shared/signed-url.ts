import * as crypto from 'crypto';

export interface CreateSignedUrlParams {
  /** CloudFront Key Pair ID (from stack output SigningKeyPairId). */
  keyPairId: string;
  /** Base URL of the distribution, e.g. https://d123abc.cloudfront.net (no trailing slash). */
  distributionUrl: string;
  /** PEM-encoded RSA private key (from env or Secrets Manager). */
  privateKeyPem: string;
  /** Object path/key, e.g. AL01.html or miniquizzes/AL01.html. */
  path: string;
  /** Expiration in seconds from now (default 3600). */
  expirySeconds?: number;
  /** Optional IP restriction (e.g. user IP). */
  ipAddress?: string;
}

/**
 * Create a CloudFront signed URL for a miniquiz object.
 * Use in your backend after validating the user (e.g. paid/subscription).
 *
 * @example
 * const url = createMiniquizSignedUrl({
 *   keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID!,
 *   distributionUrl: process.env.CLOUDFRONT_URL!,
 *   privateKeyPem: process.env.CLOUDFRONT_SIGNING_PRIVATE_KEY_PEM!,
 *   path: 'AL01.html',
 *   expirySeconds: 3600,
 * });
 */
export function createMiniquizSignedUrl(params: CreateSignedUrlParams): string {
  const {
    keyPairId,
    distributionUrl,
    privateKeyPem,
    path,
    expirySeconds = 3600,
    ipAddress,
  } = params;

  const base = distributionUrl.replace(/\/$/, '');
  const resourcePath = path.replace(/^\//, '');
  const resourceUrl = `${base}/${resourcePath}`;

  const expiration = Math.floor(Date.now() / 1000) + expirySeconds;
  const policy = {
    Statement: [
      {
        Resource: resourceUrl,
        Condition: {
          DateLessThan: { 'AWS:EpochTime': expiration },
          ...(ipAddress && {
            IpAddress: { 'AWS:SourceIp': ipAddress },
          }),
        },
      },
    ],
  };

  const policyString = JSON.stringify(policy);
  const policyBase64 = Buffer.from(policyString)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  const signature = crypto
    .createSign('RSA-SHA1')
    .update(policyString)
    .sign(privateKeyPem, 'base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return `${resourceUrl}?Policy=${policyBase64}&Signature=${signature}&Key-Pair-Id=${keyPairId}`;
}

/**
 * Create signed URLs for multiple paths in one call.
 */
export function createMiniquizSignedUrls(
  params: Omit<CreateSignedUrlParams, 'path'> & { paths: string[] }
): Record<string, string> {
  const { paths, ...rest } = params;
  const result: Record<string, string> = {};
  for (const path of paths) {
    result[path] = createMiniquizSignedUrl({ ...rest, path });
  }
  return result;
}
