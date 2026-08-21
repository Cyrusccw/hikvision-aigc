export async function callDeepSeek(messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY is not configured');

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages,
    }),
  });

  if (!response.ok) throw new Error(`DeepSeek failed: ${response.status}`);
  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? '{}';
}
