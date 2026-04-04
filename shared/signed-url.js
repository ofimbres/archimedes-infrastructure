"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMiniquizSignedUrls = exports.createMiniquizSignedUrl = void 0;
const crypto = require("crypto");
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
function createMiniquizSignedUrl(params) {
    const { keyPairId, distributionUrl, privateKeyPem, path, expirySeconds = 3600, ipAddress, } = params;
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
exports.createMiniquizSignedUrl = createMiniquizSignedUrl;
/**
 * Create signed URLs for multiple paths in one call.
 */
function createMiniquizSignedUrls(params) {
    const { paths, ...rest } = params;
    const result = {};
    for (const path of paths) {
        result[path] = createMiniquizSignedUrl({ ...rest, path });
    }
    return result;
}
exports.createMiniquizSignedUrls = createMiniquizSignedUrls;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2lnbmVkLXVybC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNpZ25lZC11cmwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsaUNBQWlDO0FBaUJqQzs7Ozs7Ozs7Ozs7O0dBWUc7QUFDSCxTQUFnQix1QkFBdUIsQ0FBQyxNQUE2QjtJQUNuRSxNQUFNLEVBQ0osU0FBUyxFQUNULGVBQWUsRUFDZixhQUFhLEVBQ2IsSUFBSSxFQUNKLGFBQWEsR0FBRyxJQUFJLEVBQ3BCLFNBQVMsR0FDVixHQUFHLE1BQU0sQ0FBQztJQUVYLE1BQU0sSUFBSSxHQUFHLGVBQWUsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ2hELE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQzdDLE1BQU0sV0FBVyxHQUFHLEdBQUcsSUFBSSxJQUFJLFlBQVksRUFBRSxDQUFDO0lBRTlDLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLElBQUksQ0FBQyxHQUFHLGFBQWEsQ0FBQztJQUNqRSxNQUFNLE1BQU0sR0FBRztRQUNiLFNBQVMsRUFBRTtZQUNUO2dCQUNFLFFBQVEsRUFBRSxXQUFXO2dCQUNyQixTQUFTLEVBQUU7b0JBQ1QsWUFBWSxFQUFFLEVBQUUsZUFBZSxFQUFFLFVBQVUsRUFBRTtvQkFDN0MsR0FBRyxDQUFDLFNBQVMsSUFBSTt3QkFDZixTQUFTLEVBQUUsRUFBRSxjQUFjLEVBQUUsU0FBUyxFQUFFO3FCQUN6QyxDQUFDO2lCQUNIO2FBQ0Y7U0FDRjtLQUNGLENBQUM7SUFFRixNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQzVDLE1BQU0sWUFBWSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDO1NBQzNDLFFBQVEsQ0FBQyxRQUFRLENBQUM7U0FDbEIsT0FBTyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUM7U0FDbkIsT0FBTyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUM7U0FDbkIsT0FBTyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQztJQUVyQixNQUFNLFNBQVMsR0FBRyxNQUFNO1NBQ3JCLFVBQVUsQ0FBQyxVQUFVLENBQUM7U0FDdEIsTUFBTSxDQUFDLFlBQVksQ0FBQztTQUNwQixJQUFJLENBQUMsYUFBYSxFQUFFLFFBQVEsQ0FBQztTQUM3QixPQUFPLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQztTQUNuQixPQUFPLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQztTQUNuQixPQUFPLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBRXJCLE9BQU8sR0FBRyxXQUFXLFdBQVcsWUFBWSxjQUFjLFNBQVMsZ0JBQWdCLFNBQVMsRUFBRSxDQUFDO0FBQ2pHLENBQUM7QUE3Q0QsMERBNkNDO0FBRUQ7O0dBRUc7QUFDSCxTQUFnQix3QkFBd0IsQ0FDdEMsTUFBaUU7SUFFakUsTUFBTSxFQUFFLEtBQUssRUFBRSxHQUFHLElBQUksRUFBRSxHQUFHLE1BQU0sQ0FBQztJQUNsQyxNQUFNLE1BQU0sR0FBMkIsRUFBRSxDQUFDO0lBQzFDLEtBQUssTUFBTSxJQUFJLElBQUksS0FBSyxFQUFFO1FBQ3hCLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyx1QkFBdUIsQ0FBQyxFQUFFLEdBQUcsSUFBSSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7S0FDM0Q7SUFDRCxPQUFPLE1BQU0sQ0FBQztBQUNoQixDQUFDO0FBVEQsNERBU0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjcnlwdG8gZnJvbSAnY3J5cHRvJztcblxuZXhwb3J0IGludGVyZmFjZSBDcmVhdGVTaWduZWRVcmxQYXJhbXMge1xuICAvKiogQ2xvdWRGcm9udCBLZXkgUGFpciBJRCAoZnJvbSBzdGFjayBvdXRwdXQgU2lnbmluZ0tleVBhaXJJZCkuICovXG4gIGtleVBhaXJJZDogc3RyaW5nO1xuICAvKiogQmFzZSBVUkwgb2YgdGhlIGRpc3RyaWJ1dGlvbiwgZS5nLiBodHRwczovL2QxMjNhYmMuY2xvdWRmcm9udC5uZXQgKG5vIHRyYWlsaW5nIHNsYXNoKS4gKi9cbiAgZGlzdHJpYnV0aW9uVXJsOiBzdHJpbmc7XG4gIC8qKiBQRU0tZW5jb2RlZCBSU0EgcHJpdmF0ZSBrZXkgKGZyb20gZW52IG9yIFNlY3JldHMgTWFuYWdlcikuICovXG4gIHByaXZhdGVLZXlQZW06IHN0cmluZztcbiAgLyoqIE9iamVjdCBwYXRoL2tleSwgZS5nLiBBTDAxLmh0bWwgb3IgbWluaXF1aXp6ZXMvQUwwMS5odG1sLiAqL1xuICBwYXRoOiBzdHJpbmc7XG4gIC8qKiBFeHBpcmF0aW9uIGluIHNlY29uZHMgZnJvbSBub3cgKGRlZmF1bHQgMzYwMCkuICovXG4gIGV4cGlyeVNlY29uZHM/OiBudW1iZXI7XG4gIC8qKiBPcHRpb25hbCBJUCByZXN0cmljdGlvbiAoZS5nLiB1c2VyIElQKS4gKi9cbiAgaXBBZGRyZXNzPzogc3RyaW5nO1xufVxuXG4vKipcbiAqIENyZWF0ZSBhIENsb3VkRnJvbnQgc2lnbmVkIFVSTCBmb3IgYSBtaW5pcXVpeiBvYmplY3QuXG4gKiBVc2UgaW4geW91ciBiYWNrZW5kIGFmdGVyIHZhbGlkYXRpbmcgdGhlIHVzZXIgKGUuZy4gcGFpZC9zdWJzY3JpcHRpb24pLlxuICpcbiAqIEBleGFtcGxlXG4gKiBjb25zdCB1cmwgPSBjcmVhdGVNaW5pcXVpelNpZ25lZFVybCh7XG4gKiAgIGtleVBhaXJJZDogcHJvY2Vzcy5lbnYuQ0xPVURGUk9OVF9LRVlfUEFJUl9JRCEsXG4gKiAgIGRpc3RyaWJ1dGlvblVybDogcHJvY2Vzcy5lbnYuQ0xPVURGUk9OVF9VUkwhLFxuICogICBwcml2YXRlS2V5UGVtOiBwcm9jZXNzLmVudi5DTE9VREZST05UX1NJR05JTkdfUFJJVkFURV9LRVlfUEVNISxcbiAqICAgcGF0aDogJ0FMMDEuaHRtbCcsXG4gKiAgIGV4cGlyeVNlY29uZHM6IDM2MDAsXG4gKiB9KTtcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU1pbmlxdWl6U2lnbmVkVXJsKHBhcmFtczogQ3JlYXRlU2lnbmVkVXJsUGFyYW1zKTogc3RyaW5nIHtcbiAgY29uc3Qge1xuICAgIGtleVBhaXJJZCxcbiAgICBkaXN0cmlidXRpb25VcmwsXG4gICAgcHJpdmF0ZUtleVBlbSxcbiAgICBwYXRoLFxuICAgIGV4cGlyeVNlY29uZHMgPSAzNjAwLFxuICAgIGlwQWRkcmVzcyxcbiAgfSA9IHBhcmFtcztcblxuICBjb25zdCBiYXNlID0gZGlzdHJpYnV0aW9uVXJsLnJlcGxhY2UoL1xcLyQvLCAnJyk7XG4gIGNvbnN0IHJlc291cmNlUGF0aCA9IHBhdGgucmVwbGFjZSgvXlxcLy8sICcnKTtcbiAgY29uc3QgcmVzb3VyY2VVcmwgPSBgJHtiYXNlfS8ke3Jlc291cmNlUGF0aH1gO1xuXG4gIGNvbnN0IGV4cGlyYXRpb24gPSBNYXRoLmZsb29yKERhdGUubm93KCkgLyAxMDAwKSArIGV4cGlyeVNlY29uZHM7XG4gIGNvbnN0IHBvbGljeSA9IHtcbiAgICBTdGF0ZW1lbnQ6IFtcbiAgICAgIHtcbiAgICAgICAgUmVzb3VyY2U6IHJlc291cmNlVXJsLFxuICAgICAgICBDb25kaXRpb246IHtcbiAgICAgICAgICBEYXRlTGVzc1RoYW46IHsgJ0FXUzpFcG9jaFRpbWUnOiBleHBpcmF0aW9uIH0sXG4gICAgICAgICAgLi4uKGlwQWRkcmVzcyAmJiB7XG4gICAgICAgICAgICBJcEFkZHJlc3M6IHsgJ0FXUzpTb3VyY2VJcCc6IGlwQWRkcmVzcyB9LFxuICAgICAgICAgIH0pLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICBdLFxuICB9O1xuXG4gIGNvbnN0IHBvbGljeVN0cmluZyA9IEpTT04uc3RyaW5naWZ5KHBvbGljeSk7XG4gIGNvbnN0IHBvbGljeUJhc2U2NCA9IEJ1ZmZlci5mcm9tKHBvbGljeVN0cmluZylcbiAgICAudG9TdHJpbmcoJ2Jhc2U2NCcpXG4gICAgLnJlcGxhY2UoL1xcKy9nLCAnLScpXG4gICAgLnJlcGxhY2UoL1xcLy9nLCAnXycpXG4gICAgLnJlcGxhY2UoLz0vZywgJycpO1xuXG4gIGNvbnN0IHNpZ25hdHVyZSA9IGNyeXB0b1xuICAgIC5jcmVhdGVTaWduKCdSU0EtU0hBMScpXG4gICAgLnVwZGF0ZShwb2xpY3lTdHJpbmcpXG4gICAgLnNpZ24ocHJpdmF0ZUtleVBlbSwgJ2Jhc2U2NCcpXG4gICAgLnJlcGxhY2UoL1xcKy9nLCAnLScpXG4gICAgLnJlcGxhY2UoL1xcLy9nLCAnXycpXG4gICAgLnJlcGxhY2UoLz0vZywgJycpO1xuXG4gIHJldHVybiBgJHtyZXNvdXJjZVVybH0/UG9saWN5PSR7cG9saWN5QmFzZTY0fSZTaWduYXR1cmU9JHtzaWduYXR1cmV9JktleS1QYWlyLUlkPSR7a2V5UGFpcklkfWA7XG59XG5cbi8qKlxuICogQ3JlYXRlIHNpZ25lZCBVUkxzIGZvciBtdWx0aXBsZSBwYXRocyBpbiBvbmUgY2FsbC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU1pbmlxdWl6U2lnbmVkVXJscyhcbiAgcGFyYW1zOiBPbWl0PENyZWF0ZVNpZ25lZFVybFBhcmFtcywgJ3BhdGgnPiAmIHsgcGF0aHM6IHN0cmluZ1tdIH1cbik6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4ge1xuICBjb25zdCB7IHBhdGhzLCAuLi5yZXN0IH0gPSBwYXJhbXM7XG4gIGNvbnN0IHJlc3VsdDogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHt9O1xuICBmb3IgKGNvbnN0IHBhdGggb2YgcGF0aHMpIHtcbiAgICByZXN1bHRbcGF0aF0gPSBjcmVhdGVNaW5pcXVpelNpZ25lZFVybCh7IC4uLnJlc3QsIHBhdGggfSk7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cbiJdfQ==