import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const projectId = process.env.GCLOUD_PROJECT || 'ptitvestiaire-40da8';
let secretManager: SecretManagerServiceClient | null = null;

function getManager(): SecretManagerServiceClient {
  if (!secretManager) {
    secretManager = new SecretManagerServiceClient();
  }
  return secretManager;
}

export async function getSecret(secretName: string): Promise<string> {
  try {
    const [version] = await getManager().accessSecretVersion({
      name: `projects/${projectId}/secrets/${secretName}/versions/latest`,
    });
    return version.payload?.data?.toString() || '';
  } catch (error) {
    console.error(`Failed to get secret ${secretName}:`, error);
    return '';
  }
}
