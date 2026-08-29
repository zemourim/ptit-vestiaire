import Anthropic from '@anthropic-ai/sdk';
import { initializeApp } from 'firebase-admin/app';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2/options';

initializeApp();
setGlobalOptions({ region: 'europe-west1', maxInstances: 2 });

type AnalyzeRequest = {
  imageBase64?: string;
  mimeType?: string;
};

const acceptedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const;

export const analyzeVetements = onCall<AnalyzeRequest>({ secrets: ['ANTHROPIC_API_KEY'] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Connexion requise.');
  }

  const { imageBase64, mimeType = 'image/jpeg' } = request.data;
  if (!imageBase64) {
    throw new HttpsError('invalid-argument', 'Photo manquante.');
  }

  if (!acceptedMimeTypes.includes(mimeType as (typeof acceptedMimeTypes)[number])) {
    throw new HttpsError('invalid-argument', 'Format image non pris en charge.');
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { vetements: [] };
  }

  const anthropic = new Anthropic({ apiKey });
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-latest',
    max_tokens: 300,
    temperature: 0,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mimeType as (typeof acceptedMimeTypes)[number],
              data: imageBase64
            }
          },
          {
            type: 'text',
            text: 'Liste uniquement les vêtements visibles sur cette photo en français. Réponds avec un tableau JSON de chaînes courtes, sans phrase autour. Exemple: ["manteau bleu", "baskets blanches"]. Ignore le visage, le corps, le décor et les objets non portés.'
          }
        ]
      }
    ]
  });

  const text = response.content.find((block) => block.type === 'text')?.text ?? '[]';
  const parsed = JSON.parse(text) as unknown;
  if (!Array.isArray(parsed)) return { vetements: [] };

  const vetements = parsed
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 12);

  return { vetements };
});
