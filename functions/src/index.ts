import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import Anthropic from '@anthropic-ai/sdk';

type AnalyzeRequest = {
  imageBase64?: string;
  mimeType?: string;
};

const anthropicApiKey = defineSecret('ANTHROPIC_API_KEY');

export const analyzeVetementsV2 = onCall<AnalyzeRequest>(
  { secrets: [anthropicApiKey] },
  async (request) => {
    try {
      if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated');
      }

      const { imageBase64, mimeType } = request.data;

      if (!imageBase64 || !mimeType) {
        throw new HttpsError('invalid-argument', 'imageBase64 and mimeType are required');
      }

      const apiKeyValue = anthropicApiKey.value();
      if (!apiKeyValue) {
        throw new Error('ANTHROPIC_API_KEY secret not available');
      }

      const client = new Anthropic({ apiKey: apiKeyValue });

      const response = await client.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                  data: imageBase64,
                },
              },
              {
                type: 'text',
                text: 'List all visible clothing items in JSON array format only. Example: ["shirt", "pants"]. Return empty array [] if no clothes visible.',
              },
            ],
          },
        ],
      });

      const textContent = response.content.find((c) => c.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text response from Anthropic');
      }

      let vetements: string[] = [];
      try {
        const parsed = JSON.parse(textContent.text);
        if (Array.isArray(parsed)) {
          vetements = parsed.filter((item): item is string => typeof item === 'string').map((s) => s.toLowerCase());
        }
      } catch {
        vetements = [];
      }

      return { vetements };
    } catch (error) {
      if (error instanceof HttpsError) {
        throw error;
      }
      const msg = error instanceof Error ? error.message : String(error);
      throw new HttpsError('internal', msg);
    }
  }
);
