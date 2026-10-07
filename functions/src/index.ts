import { HttpsError, onCall } from 'firebase-functions/v2/https';

type AnalyzeRequest = {
  imageBase64?: string;
  mimeType?: string;
};

export const analyzeVetementsV2 = onCall<AnalyzeRequest>(async (request) => {
  try {
    console.log('analyzeVetementsV2 called');
    console.log('Auth:', request.auth?.uid);
    console.log('Data keys:', Object.keys(request.data));

    if (!request.auth) {
      console.log('ERROR: No authentication');
      throw new HttpsError('unauthenticated', 'Not authenticated');
    }

    const { imageBase64, mimeType } = request.data;
    console.log('Has imageBase64:', !!imageBase64);
    console.log('mimeType:', mimeType);

    if (!imageBase64 || !mimeType) {
      console.log('ERROR: Missing imageBase64 or mimeType');
      throw new HttpsError('invalid-argument', `Missing data: imageBase64=${!!imageBase64}, mimeType=${mimeType}`);
    }

    console.log('Returning test data');
    return { vetements: ['test item'] };
  } catch (error) {
    console.error('Error in analyzeVetementsV2:', error);
    if (error instanceof HttpsError) throw error;
    const message = error instanceof Error ? error.message : String(error);
    console.error('Throwing internal error:', message);
    throw new HttpsError('internal', `Error: ${message}`);
  }
});
