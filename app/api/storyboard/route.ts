import { NextResponse } from 'next/server';
import { callDeepSeek } from '@/lib/ai/deepseek';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productKnowledge, creativeIdea, language = 'English', duration = 15 } = body;

    const system = `You are a senior commercial film director for a global B2B technology brand. Build concise, visually executable storyboards for AI image/video generation. Keep all product facts grounded in the supplied product knowledge. Return JSON only.`;
    const user = `Create a ${duration}-second product video storyboard in ${language}.\n\nPRODUCT KNOWLEDGE:\n${JSON.stringify(productKnowledge)}\n\nCREATIVE IDEA:\n${creativeIdea || 'Create a premium cinematic product story.'}\n\nReturn: {title,totalDuration,language,shots:[{id,title,duration,purpose,scene,action,camera,lighting,keyframePrompt,videoPrompt,selected:true}]}. Prefer 3 shots for a 15-second video. Each shot must be independently generatable.`;

    const content = await callDeepSeek([
      { role: 'system', content: system },
      { role: 'user', content: user },
    ]);

    return NextResponse.json(JSON.parse(content));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Storyboard generation failed' },
      { status: 500 },
    );
  }
}
