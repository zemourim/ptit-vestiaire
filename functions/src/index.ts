import Anthropic from '@anthropic-ai/sdk';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

type AnalyzeRequest = {
  imageBase64?: string;
  mimeType?: string;
};

const acceptedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;
const clothingPrompt = 'Analyse cette photo et liste uniquement les vêtements et accessoires visibles et portés. Réponds exclusivement avec un tableau JSON valide de chaînes courtes en français, sans Markdown ni phrase autour. Exemple : ["manteau bleu", "baskets blanches"]. N’inclus pas les personnes, le visage, le décor ou les objets qui ne sont pas des vêtements/accessoires.';

export const analyzeVetements = onCall<AnalyzeRequest>({ secrets: ['ANTHROPIC_API_KEY'] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Connecte-toi pour analyser une photo.');
  }

  const { imageBase64, mimeType } = request.data;
  if (!imageBase64 || !mimeType || !acceptedMimeTypes.includes(mimeType as (typeof acceptedMimeTypes)[number])) {
    throw new HttpsError('invalid-argument', 'La photo fournie n’est pas valide.');
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new HttpsError('failed-precondition', 'La clé Anthropic n’est pas configurée côté serveur.');
  }

  const anthropic = new Anthropic({ apiKey });
  let response;
  try {
    response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      temperature: 0,
      messages: [{
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
          { type: 'text', text: clothingPrompt }
        ]
      }]
    });
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : '';
    if (message.toLowerCase().includes('credit') || message.toLowerCase().includes('billing')) {
      throw new HttpsError('failed-precondition', 'Le crédit Anthropic est insuffisant.');
    }
    throw new HttpsError('unavailable', 'Le service d’analyse IA est temporairement indisponible.');
  }

  const text = response.content.find((block) => block.type === 'text')?.text ?? '[]';
  try {
    const parsed: unknown = JSON.parse(text);
    if (!Array.isArray(parsed) || !parsed.every((item) => typeof item === 'string')) {
      throw new Error('Invalid response shape');
    }
    return { vetements: parsed.map((item) => item.trim()).filter(Boolean).slice(0, 20) };
  } catch {
    throw new HttpsError('internal', 'La réponse de l’analyse IA est invalide.');
  }
});
