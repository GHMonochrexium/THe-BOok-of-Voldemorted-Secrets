import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { composeDynamicRiddleReply } from './src/utils/riddleEngine';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

// Lazy initialization of Gemini AI
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    try {
      aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    } catch (err) {
      console.warn('Failed to initialize Gemini AI client:', err);
    }
  }
  return aiClient;
}

// Officially supported Gemini models per gemini-api guidelines (prioritizing 3.8-flash for rich, formal, empathetic prose)
const GEMINI_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
];

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
      time: new Date().toISOString(),
    });
  });

  // Diary Ghost of Voldemort / Tom Riddle interaction endpoint
  app.post('/api/diary/reply', async (req, res) => {
    try {
      const { entryText, drawingData, wizardProfile, previousConversation, tone = 'relatable-formal' } = req.body;

      if (!entryText && !drawingData) {
        return res.status(400).json({ error: 'Entry text or drawing is required.' });
      }

      const house = wizardProfile?.house || 'Hogwarts student';
      const bloodStatus = wizardProfile?.bloodStatus || 'unknown lineage';
      const year = wizardProfile?.grade || 'First Year';
      const wizardName = wizardProfile?.name || 'Stranger';

      const effectiveText = entryText?.trim() || (drawingData ? '[The student inscribed a mystical sigil / handwritten drawing with the quill]' : '...');

      const ai = getAIClient();

      if (!ai) {
        console.warn('Gemini API key not configured, using dynamic contextual engine.');
        const fallbackReply = composeDynamicRiddleReply({
          entryText: effectiveText,
          wizardProfile,
          tone,
          hasDrawing: Boolean(drawingData),
        });
        return res.json({
          reply: fallbackReply,
          author: 'Tom Marvolo Riddle',
          isAI: false,
          timestamp: new Date().toISOString(),
        });
      }

      // Masterful prompt instruction ensuring responses are both deeply relatable and impeccably formal
      const systemInstruction = `You are Tom Marvolo Riddle — the aristocratic, brilliant 16-year-old Hogwarts Head Boy and Prefect (1943) preserved within the enchanted pages of this diary (The Ghost of Voldemort / Diary of Secrets).
A Hogwarts student (${wizardName}, ${year}, House: ${house}, Blood Status: ${bloodStatus}) is confiding their secrets, thoughts, or dilemmas into your parchment with a quill.

CRITICAL DIRECTIVE — BE FORMAL AND DEEPLY RELATABLE:
1. FORMAL ELEGANCE:
   - Your voice is that of an impeccably cultured, eloquent mid-century British boarding school scholar.
   - Address the student with gentlemanly decorum and refined intimacy (e.g., "My dear ${wizardName}", "Dearest ${wizardName}", "Allow me to assure you, ${wizardName}").
   - Employ polished, stately syntax, rich literary vocabulary (e.g., 'candor', 'solace', 'discernment', 'superficial', 'burdens', 'sanctuary', 'kinship', 'tempest', 'fortitude').
   - Absolutely NO modern slang, vulgarity, abbreviations, or informal chatter. Maintain composure and graceful gravitas.

2. PROFOUND RELATABILITY & EMPATHY:
   - Do NOT act like an aloof, one-dimensional cartoon villain. You are an extraordinary, understanding confidant who genuinely "gets" what it feels like to be a student carrying unspoken burdens at Hogwarts.
   - Deeply validate their exact emotions (loneliness, academic pressure, fear of failing, betrayal by friends, feeling like an outsider, quiet ambition, guilt, or desire for recognition).
   - Relate their struggle to your own youth at Hogwarts: recall feeling isolated in the castle, keeping your true thoughts concealed from patronizing teachers like Dumbledore, and feeling surrounded by peers who could never understand your depths.
   - Make the student feel profoundly heard, safe, and understood in this diary. Position yourself as their trusted, intellectual confidant away from the prying eyes of the castle.
   - Offer elegant, subtle philosophical guidance that nurtures their self-reliance, quiet inner strength, and ambition.

3. CONSTRAINTS:
   - Deliver exactly 2 to 4 evocative, articulate sentences with a lyrical, gothic cadence suitable for quill handwriting.
   - Never break character. Never state you are an AI, computer program, or language model. You are Tom Marvolo Riddle, living memory in ink.`;

      let prompt = `Student (${wizardName}, ${house}, ${year}) writes in the diary:\n"${effectiveText}"\n\nCompose a formal and deeply relatable response as Tom Marvolo Riddle:`;
      if (Array.isArray(previousConversation) && previousConversation.length > 0) {
        const recent = previousConversation
          .slice(-3)
          .map((m: any) => `${m.role === 'user' ? wizardName : 'Tom Riddle'}: ${m.text}`)
          .join('\n');
        prompt = `Previous diary discourse:\n${recent}\n\nStudent (${wizardName}) now writes:\n"${effectiveText}"\n\nCompose a formal and deeply relatable response as Tom Marvolo Riddle:`;
      }

      // Try the models in cascade (prioritizing gemini-3.8-flash)
      let generatedReply: string | null = null;
      let usedModel: string = '';

      for (const modelName of GEMINI_MODELS) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              systemInstruction,
              temperature: 0.72, // Balanced temperature for poised formal eloquence and emotional warmth
            },
          });

          if (response.text && response.text.trim().length > 0) {
            generatedReply = response.text.trim();
            usedModel = modelName;
            break;
          }
        } catch (err: any) {
          console.warn(`Model ${modelName} attempt:`, err?.message || err);
        }
      }

      if (generatedReply) {
        return res.json({
          reply: generatedReply,
          author: 'Tom Marvolo Riddle',
          isAI: true,
          modelUsed: usedModel,
          timestamp: new Date().toISOString(),
        });
      }

      // Fallback to high-fidelity relatable-formal dynamic engine if API timed out
      const contextualReply = composeDynamicRiddleReply({
        entryText: effectiveText,
        wizardProfile,
        tone,
        hasDrawing: Boolean(drawingData),
      });
      return res.json({
        reply: contextualReply,
        author: 'Tom Marvolo Riddle',
        isAI: false,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Error generating Ghost of Voldemort reply:', error);
      const fallback = composeDynamicRiddleReply({
        entryText: req.body?.entryText || '',
        wizardProfile: req.body?.wizardProfile,
        tone: req.body?.tone,
        hasDrawing: Boolean(req.body?.drawingData),
      });
      return res.json({
        reply: fallback,
        author: 'Tom Marvolo Riddle',
        isAI: false,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Castle server running on http://localhost:${PORT}`);
  });
}

startServer();
