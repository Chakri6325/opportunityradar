import dotenv from 'dotenv';
dotenv.config();

export const workiqConfig = {
  gatewayUrl: process.env.WORKIQ_GATEWAY_URL || 'https://workiq.svc.cloud.microsoft',
  clientId: process.env.WORKIQ_CLIENT_ID || process.env.GITHUB_CLIENT_ID || '',
  clientSecret: process.env.WORKIQ_CLIENT_SECRET || process.env.GITHUB_CLIENT_SECRET || '',
  tenantId: process.env.WORKIQ_TENANT_ID || 'common',
};
