import * as AWS from 'aws-sdk';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

export interface SignedUrlOptions {
  /**
   * CloudFront distribution domain name
   */
  distributionDomain: string;
  
  /**
   * CloudFront Key Pair ID
   */
  keyPairId: string;
  
  /**
   * Path to private key file
   */
  privateKeyPath: string;
  
  /**
   * URL expiration time in seconds from now
   */
  expirationTimeSeconds?: number;
  
  /**
   * IP address restriction (optional)
   */
  ipAddress?: string;
}

export class SignedUrlGenerator {
  private privateKey: string;
  
  constructor(privateKeyPath: string) {
    this.privateKey = fs.readFileSync(privateKeyPath, 'utf8');
  }

  /**
   * Generate a signed URL for CloudFront
   */
  generateSignedUrl(resourcePath: string, options: SignedUrlOptions): string {
    const {
      distributionDomain,
      keyPairId,
      expirationTimeSeconds = 3600,
      ipAddress
    } = options;

    const expiration = Math.floor(Date.now() / 1000) + expirationTimeSeconds;
    const resourceUrl = `https://${distributionDomain}/${resourcePath.replace(/^\//, '')}`;

    // Create policy
    const policy = {
      Statement: [{
        Resource: resourceUrl,
        Condition: {
          DateLessThan: {
            'AWS:EpochTime': expiration
          },
          ...(ipAddress && {
            IpAddress: {
              'AWS:SourceIp': ipAddress
            }
          })
        }
      }]
    };

    const policyString = JSON.stringify(policy);
    const policyBase64 = Buffer.from(policyString)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    // Create signature
    const signature = crypto
      .createSign('RSA-SHA1')
      .update(policyString)
      .sign(this.privateKey, 'base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    return `${resourceUrl}?Policy=${policyBase64}&Signature=${signature}&Key-Pair-Id=${keyPairId}`;
  }

  /**
   * Generate signed URLs for multiple files
   */
  generateSignedUrls(resourcePaths: string[], options: SignedUrlOptions): Record<string, string> {
    const signedUrls: Record<string, string> = {};
    
    for (const path of resourcePaths) {
      signedUrls[path] = this.generateSignedUrl(path, options);
    }
    
    return signedUrls;
  }
}

// Example usage function
export function createSignedUrlsForHtmlFiles(
  distributionDomain: string,
  keyPairId: string,
  privateKeyPath: string,
  htmlFiles: string[] = []
): Record<string, string> {
  const generator = new SignedUrlGenerator(privateKeyPath);
  
  const options: SignedUrlOptions = {
    distributionDomain,
    keyPairId,
    privateKeyPath,
    expirationTimeSeconds: 3600, // 1 hour
  };

  // If no files specified, use some example ones
  const filesToSign = htmlFiles.length > 0 ? htmlFiles : [
    'AL01.html',
    'AL02.html',
    'AN01.html',
    'CF01.html'
  ];

  return generator.generateSignedUrls(filesToSign, options);
}

// CLI usage example
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 3) {
    console.log('Usage: ts-node signed-url-generator.ts <distributionDomain> <keyPairId> <privateKeyPath> [htmlFile1] [htmlFile2] ...');
    process.exit(1);
  }

  const [distributionDomain, keyPairId, privateKeyPath, ...htmlFiles] = args;
  
  try {
    const signedUrls = createSignedUrlsForHtmlFiles(
      distributionDomain,
      keyPairId,
      privateKeyPath,
      htmlFiles
    );

    console.log('Signed URLs generated:');
    console.log(JSON.stringify(signedUrls, null, 2));
  } catch (error) {
    console.error('Error generating signed URLs:', error);
    process.exit(1);
  }
}