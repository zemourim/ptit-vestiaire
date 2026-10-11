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
    console.log('=== analyzeVetementsV2 called ===');
    console.log('Auth UID:', request.auth?.uid);
    console.log('Has auth:', !!request.auth);

    try {
      if (!request.auth) {
        console.log('ERROR: No authentication');
        throw new HttpsError('unauthenticated', 'Not authenticated');
      }

      const { imageBase64, mimeType } = request.data;
      console.log('Has imageBase64:', !!imageBase64, 'Length:', imageBase64?.length);
      console.log('mimeType:', mimeType);

      if (!imageBase64 || !mimeType) {
        console.log('ERROR: Missing imageBase64 or mimeType');
        throw new HttpsError('invalid-argument', `Missing imageBase64=${!!imageBase64} or mimeType=${!!mimeType}`);
      }

      console.log('Getting API key...');
      const apiKey = anthropicApiKey.value();
      console.log('API key available:', !!apiKey, 'Length:', apiKey?.length);

      if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY is not set');
      }

      console.log('Creating Anthropic client...');
      const client = new Anthropic({ apiKey });
      console.log('Client created');

      console.log('Calling Anthropic API...');
      const response = await client.messages.create({
        model: 'claude-3-5-haiku-20241022',
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

      console.log('Got response from Anthropic');
      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Anthropic');
      }

      console.log('Parsing response:', content.text.substring(0, 100));
      let vetements: string[] = [];
      try {
        vetements = JSON.parse(content.text);
        if (!Array.isArray(vetements)) {
          vetements = [];
        }
        vetements = vetements.filter((item) => typeof item === 'string').map((item) => item.toLowerCase());
      } catch (parseError) {
        console.warn('Failed to parse response as JSON:', content.text);
        vetements = [];
      }

      console.log('Returning vetements:', vetements);
      return { vetements };
    } catch (error) {
      console.error('=== ERROR in analyzeVetementsV2 ===');
      console.error('Error type:', error?.constructor?.name);
      console.error('Error message:', error instanceof Error ? error.message : String(error));
      console.error('Full error:', error);

      if (error instanceof HttpsError) throw error;
      const message = error instanceof Error ? error.message : String(error);
      throw new HttpsError('internal', message);
    }
  }
);
