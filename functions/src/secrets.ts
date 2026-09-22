import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const secretManager = new SecretManagerServiceClient();
const projectId = process.env.GCLOUD_PROJECT || 'ptitvestiaire-40da8';

export async function getSecret(secretName: string): Promise<string> {
  try {
    const [version] = await secretManager.accessSecretVersion({
      name: `projects/${projectId}/secrets/${secretName}/versions/latest`,
    });
    return version.payload?.data?.toString() || '';
  } catch (error) {
    console.error(`Failed to get secret ${secretName}:`, error);
    return '';
  }
}
