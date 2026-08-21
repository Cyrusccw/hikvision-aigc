import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generateKeyframe } from '@/lib/ai/seedream';

const requestSchema = z.object({
  prompt: z.string().min(10),
  aspectRatio: z.enum(['16:9', '9:16', '1:1']).default('16:9'),
  referenceImages: z.array(z.string()).default([]),
  productConstraints: z.array(z.string()).default([]),
});

export async function POST(request: Request) {
  try {
    const input = requestSchema.parse(await request.json());
    const images = await generateKeyframe(input);
    return NextResponse.json({ images });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Keyframe generation failed' },
      { status: 500 },
    );
  }
}
