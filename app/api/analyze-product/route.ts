import { NextResponse } from 'next/server';
import { callDeepSeek } from '@/lib/ai/deepseek';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, specText, imageNotes, language = 'English' } = body;

    const system = `You are a strict product marketing analyst. Extract only supported product facts. Separate technical facts from marketing interpretation. Never invent capabilities. Return JSON only.`;
    const user = `Analyze this product input for downstream storyboard generation.\nURL: ${url || ''}\nSPEC: ${specText || ''}\nIMAGE NOTES: ${imageNotes || ''}\nTARGET LANGUAGE: ${language}\n\nReturn {name,category,keyFeatures,userBenefits,scenarios,visualElements,productConstraints}. Product constraints should include appearance, installation and claim rules useful for generative image/video models.`;

    const content = await callDeepSeek([
      { role: 'system', content: system },
      { role: 'user', content: user },
    ]);

    return NextResponse.json(JSON.parse(content));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Product analysis failed' },
      { status: 500 },
    );
  }
}
