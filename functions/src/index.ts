import { HttpsError, onCall } from 'firebase-functions/v2/https';

type AnalyzeRequest = {
  imageBase64?: string;
  mimeType?: string;
};

export const analyzeVetementsV2 = onCall<AnalyzeRequest>(async (request) => {
  return { vetements: ['test item 1', 'test item 2'], debug: 'function called successfully' };
});
