import '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

const relevantLabels: Record<string, string> = {
  backpack: 'sac à dos',
  handbag: 'sac à main',
  suitcase: 'valise',
  tie: 'cravate'
};

let modelPromise: Promise<cocoSsd.ObjectDetection> | null = null;

function loadModel() {
  modelPromise ??= cocoSsd.load();
  return modelPromise;
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('La photo ne peut pas être analysée.'));
    image.src = dataUrl;
  });
}

export async function analyzePhoto(dataUrl: string): Promise<string[]> {
  const [model, image] = await Promise.all([loadModel(), loadImage(dataUrl)]);
  const predictions = await model.detect(image);
  const suggestions = predictions
    .filter((prediction) => prediction.score >= 0.35 && prediction.class in relevantLabels)
    .map((prediction) => relevantLabels[prediction.class]);

  return Array.from(new Set(suggestions));
}
