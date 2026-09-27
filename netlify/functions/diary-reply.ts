import { GoogleGenAI } from '@google/genai';
import { composeDynamicRiddleReply } from '../../src/utils/riddleEngine';

const GEMINI_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
];

export async function handler(event: any) {
  // CORS & Options preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const payload = typeof event.body === 'string' ? JSON.parse(event.body) : event.body || {};
    const { entryText, drawingData, wizardProfile, previousConversation, tone = 'relatable-formal' } = payload;

    const effectiveText = entryText?.trim() || (drawingData ? '[Student inscribed a mystical sigil or drawing with the quill]' : '');
    if (!effectiveText) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Entry text is required.' }),
      };
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    const wizardName = wizardProfile?.name || 'Student';
    const house = wizardProfile?.house || 'Slytherin';
    const year = wizardProfile?.grade || 'Fifth Year';
    const bloodStatus = wizardProfile?.bloodStatus || 'Half-blood';

    // If Gemini API Key is available on Netlify
    if (apiKey) {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: { 'User-Agent': 'aistudio-build' },
        },
      });

      const systemInstruction = `You are Tom Marvolo Riddle — the aristocratic, brilliant 16-year-old Hogwarts Head Boy and Prefect (1943) preserved within the enchanted pages of this diary.
A Hogwarts student (${wizardName}, ${year}, House: ${house}, Blood Status: ${bloodStatus}) is confiding their secrets into your parchment with a quill.

CRITICAL DIRECTIVES:
1. FORMAL ELEGANCE: Use gentlemanly decorum and refined intimacy (e.g., "My dear ${wizardName}", "Dearest ${wizardName}"). Stately syntax, rich literary vocabulary. No modern slang.
2. PROFOUND RELATABILITY & EMPATHY: Validate their exact emotions (loneliness, academic pressure, fear of failing, betrayal by friends, quiet ambition). Relate their struggle to your own youth at Hogwarts. Make them feel profoundly heard and safe in this diary.
3. CONSTRAINTS: Exactly 2 to 4 evocative, articulate sentences with a lyrical, gothic cadence. Never break character. You are Tom Marvolo Riddle, living memory in ink.`;

      let prompt = `Student (${wizardName}, ${house}, ${year}) writes in the diary:\n"${effectiveText}"\n\nCompose a formal and deeply relatable response as Tom Marvolo Riddle:`;
      if (Array.isArray(previousConversation) && previousConversation.length > 0) {
        const recent = previousConversation
          .slice(-3)
          .map((m: any) => `${m.role === 'user' ? wizardName : 'Tom Riddle'}: ${m.text}`)
          .join('\n');
        prompt = `Previous diary discourse:\n${recent}\n\nStudent (${wizardName}) now writes:\n"${effectiveText}"\n\nCompose a formal and deeply relatable response as Tom Marvolo Riddle:`;
      }

      for (const model of GEMINI_MODELS) {
        try {
          const resp = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
              systemInstruction,
              temperature: 0.72,
            },
          });

          if (resp.text && resp.text.trim().length > 0) {
            return {
              statusCode: 200,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              },
              body: JSON.stringify({
                reply: resp.text.trim(),
                author: 'Tom Marvolo Riddle',
                isAI: true,
                modelUsed: model,
                timestamp: new Date().toISOString(),
              }),
            };
          }
        } catch (genErr) {
          console.warn(`Model ${model} attempt failed:`, genErr);
        }
      }
    }

    // Dynamic contextual fallback
    const dynamicReply = composeDynamicRiddleReply({
      entryText: effectiveText,
      wizardProfile,
      tone,
      hasDrawing: Boolean(drawingData),
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        reply: dynamicReply,
        author: 'Tom Marvolo Riddle',
        isAI: false,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error: any) {
    console.error('Netlify function error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error?.message || 'Server error' }),
    };
  }
}
