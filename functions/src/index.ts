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
        throw new HttpsError('unauthenticated', 'Not authenticated');
      }

      const { imageBase64, mimeType } = request.data;

      if (!imageBase64 || !mimeType) {
        throw new HttpsError('invalid-argument', 'Missing imageBase64 or mimeType');
      }

      const client = new Anthropic({
        apiKey: anthropicApiKey.value(),
      });

      const response = await client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
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
                text: 'Analyze this image and list all clothing items you see. Return ONLY a JSON array of strings with item names, nothing else. Example: ["blue jeans", "white shirt", "black shoes"]. If no clothing items are visible, return an empty array [].',
              },
            ],
          },
        ],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Anthropic');
      }

      let vetements: string[] = [];
      try {
        vetements = JSON.parse(content.text);
        if (!Array.isArray(vetements)) {
          vetements = [];
        }
        vetements = vetements.filter((item) => typeof item === 'string').map((item) => item.toLowerCase());
      } catch {
        console.warn('Failed to parse response as JSON:', content.text);
        vetements = [];
      }

      return { vetements };
    } catch (error) {
      console.error('Error in analyzeVetementsV2:', error);
      if (error instanceof HttpsError) throw error;
      const message = error instanceof Error ? error.message : String(error);
      throw new HttpsError('internal', message);
    }
  }
);
