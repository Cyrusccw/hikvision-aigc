import { NextResponse } from 'next/server';
import { callDeepSeek } from '@/lib/ai/deepseek';

function assertSafeUrl(rawUrl: string) {
  const parsed = new URL(rawUrl);
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Only http/https product URLs are supported');
  const host = parsed.hostname.toLowerCase();
  const blocked = host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host.endsWith('.local') || /^10\./.test(host) || /^192\.168\./.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host);
  if (blocked) throw new Error('Private/local URLs are not allowed');
  return parsed;
}

async function extractPageText(rawUrl?: string) {
  if (!rawUrl) return '';
  const url = assertSafeUrl(rawUrl);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 Hikvision-AIGC-Studio/0.1',
        Accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    });
    if (!response.ok) throw new Error(`Product page fetch failed: ${response.status}`);
    const html = await response.text();
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 24000);
  } finally {
    clearTimeout(timer);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, specText, imageNotes, language = 'English' } = body;
    let pageText = '';
    let pageWarning = '';

    if (url) {
      try {
        pageText = await extractPageText(url);
      } catch (error) {
        pageWarning = error instanceof Error ? error.message : 'Unable to read product page';
      }
    }

    if (!pageText && !specText && !imageNotes) {
      throw new Error(pageWarning || 'Provide a readable product URL, spec text, or image notes');
    }

    const system = `You are a strict product marketing analyst for a global technology company. Build a factual product knowledge card for downstream AIGC image/video generation. Use only information supported by the supplied page/spec/image notes. Never transfer capabilities from a related series or nearby SKU. Clearly separate technical facts from marketing interpretation. Return valid JSON only.`;
    const user = `Analyze the following product source.\n\nOFFICIAL URL:\n${url || ''}\n\nEXTRACTED PAGE TEXT:\n${pageText}\n\nSPEC / USER INPUT:\n${specText || ''}\n\nIMAGE NOTES:\n${imageNotes || ''}\n\nTARGET LANGUAGE:\n${language}\n\nReturn exactly this structure: {"name":"","category":"","keyFeatures":[],"userBenefits":[],"scenarios":[],"visualElements":[],"productConstraints":[]}. productConstraints must include useful generative-AI rules such as preserving exact housing geometry, lens count/placement, mounting orientation, logo/model integrity, and forbidding unsupported feature claims. Keep keyFeatures factual and concise.`;

    const content = await callDeepSeek([
      { role: 'system', content: system },
      { role: 'user', content: user },
    ]);

    const result = JSON.parse(content);
    return NextResponse.json({ ...result, sourceMeta: { urlRead: Boolean(pageText), pageWarning: pageWarning || null } });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Product analysis failed' },
      { status: 500 },
    );
  }
}
