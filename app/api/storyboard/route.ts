import { NextResponse } from 'next/server';
import { z } from 'zod';
import { callDeepSeek } from '@/lib/ai/deepseek';

const shotSchema = z.object({
  id: z.string(),
  title: z.string(),
  duration: z.number().positive().max(12),
  purpose: z.string(),
  scene: z.string(),
  action: z.string(),
  camera: z.string(),
  lighting: z.string(),
  keyframePrompt: z.string(),
  videoPrompt: z.string(),
  selected: z.boolean().default(true),
});

const storyboardSchema = z.object({
  title: z.string(),
  totalDuration: z.number().positive(),
  language: z.string(),
  shots: z.array(shotSchema).min(1).max(12),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      productKnowledge,
      creativeIdea,
      language = 'English',
      duration = 15,
      aspectRatio = '16:9',
    } = body;

    if (!productKnowledge?.name || !Array.isArray(productKnowledge?.keyFeatures)) {
      throw new Error('Valid product knowledge is required before storyboard generation');
    }

    const constraints = Array.isArray(productKnowledge.productConstraints)
      ? productKnowledge.productConstraints.join('\n- ')
      : 'Preserve the exact supplied product appearance and do not invent unsupported capabilities.';

    const system = `You are a senior commercial film director and prompt designer for a global B2B technology brand. Create premium but realistically executable product-video storyboards for image-to-video workflows. Product accuracy is non-negotiable. Every depicted capability must be supported by PRODUCT KNOWLEDGE. Preserve exact product geometry, lens layout, mounting method and brand/model integrity. Do not visualize invented UI, beams, holograms, scanning effects or unsupported AI features unless explicitly requested and factually supported. Return valid JSON only.`;

    const user = `Create a ${duration}-second product video storyboard in ${language}, composed for ${aspectRatio}.\n\nPRODUCT KNOWLEDGE:\n${JSON.stringify(productKnowledge)}\n\nNON-NEGOTIABLE PRODUCT CONSTRAINTS:\n- ${constraints}\n\nCREATIVE IDEA:\n${creativeIdea || 'Create a premium cinematic product story grounded in a realistic use scenario.'}\n\nDIRECTING RULES:\n1. Each shot must be independently generatable as a still keyframe and then animated into a video clip.\n2. For ~15s, normally use 3-4 shots. For ~30s, normally use 5-7 shots. Use only as many shots as the story needs.\n3. The sum of shot durations must equal approximately ${duration}s.\n4. keyframePrompt must describe ONE clear still frame: product placement, environment, composition, lens/framing, lighting, materials and product-preservation constraints.\n5. videoPrompt must start from that keyframe and describe only temporal motion: camera motion, environmental motion, subject action and pacing. Avoid changing product geometry.\n6. Keep text/logo generation out of AI imagery unless essential; titles/subtitles can be added later in editing.\n7. Make the scene commercially credible for the product's real installation/use conditions.\n8. Translate marketing-facing wording into ${language}, but keep official product/model/technology names unchanged when appropriate.\n\nReturn exactly: {"title":"","totalDuration":${duration},"language":"${language}","shots":[{"id":"shot-1","title":"","duration":5,"purpose":"","scene":"","action":"","camera":"","lighting":"","keyframePrompt":"","videoPrompt":"","selected":true}]}.`;

    const content = await callDeepSeek([
      { role: 'system', content: system },
      { role: 'user', content: user },
    ]);

    const parsed = storyboardSchema.parse(JSON.parse(content));
    const calculatedDuration = parsed.shots.reduce((sum, shot) => sum + shot.duration, 0);

    return NextResponse.json({
      ...parsed,
      totalDuration: calculatedDuration,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Storyboard generation failed' },
      { status: 500 },
    );
  }
}
