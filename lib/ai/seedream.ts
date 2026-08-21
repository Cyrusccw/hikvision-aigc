export type GenerateKeyframeInput = {
  prompt: string;
  aspectRatio?: string;
  referenceImages?: string[];
  productConstraints?: string[];
};

export type GeneratedImage = {
  id: string;
  url: string;
  provider: string;
  model?: string;
};

function mockKeyframe(prompt: string, aspectRatio: string): GeneratedImage {
  const safeTitle = prompt.slice(0, 92).replace(/[<>&"']/g, ' ');
  const width = aspectRatio === '9:16' ? 720 : aspectRatio === '1:1' ? 900 : 1280;
  const height = aspectRatio === '9:16' ? 1280 : aspectRatio === '1:1' ? 900 : 720;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#edf1f5"/><stop offset="1" stop-color="#d6dde5"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><rect x="6%" y="8%" width="88%" height="84%" rx="28" fill="none" stroke="#aeb8c4" stroke-width="2" stroke-dasharray="10 10"/><text x="50%" y="46%" dominant-baseline="middle" text-anchor="middle" font-family="Arial,sans-serif" font-size="${Math.max(18, width / 42)}" fill="#56616e">Seedream keyframe preview</text><text x="50%" y="53%" dominant-baseline="middle" text-anchor="middle" font-family="Arial,sans-serif" font-size="${Math.max(12, width / 70)}" fill="#7b8794">${safeTitle}</text></svg>`;
  return {
    id: `mock-${Date.now()}`,
    url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    provider: 'mock',
    model: 'preview',
  };
}

export async function generateKeyframe(input: GenerateKeyframeInput): Promise<GeneratedImage[]> {
  const baseUrl = process.env.SEEDREAM_BASE_URL;
  const apiKey = process.env.SEEDREAM_API_KEY;
  const model = process.env.SEEDREAM_MODEL || 'seedream';
  const aspectRatio = input.aspectRatio || '16:9';

  // Keep the full shot workflow testable before a production image provider is configured.
  if (!baseUrl || !apiKey) {
    return [mockKeyframe(input.prompt, aspectRatio)];
  }

  const prompt = [
    input.prompt,
    input.productConstraints?.length
      ? `PRODUCT CONSISTENCY RULES:\n- ${input.productConstraints.join('\n- ')}`
      : '',
  ].filter(Boolean).join('\n\n');

  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      prompt,
      aspect_ratio: aspectRatio,
      reference_images: input.referenceImages ?? [],
      n: 1,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Seedream provider failed (${response.status}): ${errorText.slice(0, 300)}`);
  }

  const payload = await response.json();
  const items = payload.data ?? payload.images ?? payload.output ?? [];
  const normalized = Array.isArray(items) ? items : [items];

  const images = normalized
    .map((item: any, index: number) => ({
      id: String(item.id ?? `seedream-${Date.now()}-${index}`),
      url: String(item.url ?? item.image_url ?? item.imageUrl ?? ''),
      provider: 'seedream',
      model,
    }))
    .filter((item: GeneratedImage) => item.url);

  if (!images.length) throw new Error('Seedream provider returned no image URL');
  return images;
}
