import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

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

// Ordered list of models to cascade through (preferring fast & available models)
const GEMINI_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-3.6-flash',
  'gemini-3.8-flash',
];

/**
 * Highly dynamic fallback generator if all external network calls fail.
 * Analyzes the student's exact text, house, and mood to compose a bespoke reply
 * so it never feels like a repetitive preset answer.
 */
function composeDynamicRiddleReply(entryText: string, wizardProfile: any): string {
  const name = wizardProfile?.name || 'young seeker';
  const house = wizardProfile?.house || 'Slytherin';
  const text = entryText.toLowerCase();

  let focus = 'secret';
  if (text.includes('chamber') || text.includes('basilisk') || text.includes('monster')) {
    return `You speak of the Chamber, ${name}. The school believes it to be a fairy tale, yet you and I know that what Salazar Slytherin sealed below the pipes still slumbers, awaiting someone worthy of its vengeance.`;
  }
  if (text.includes('dark') || text.includes('magic') || text.includes('spell') || text.includes('curse') || text.includes('power')) {
    return `There is no good and evil, ${name}—there is only power, and those too weak to seek it. Your curiosity about the forbidden arts reflects a hunger that Dumbledore would punish, but that I can nurture.`;
  }
  if (text.includes('fear') || text.includes('afraid') || text.includes('scared') || text.includes('doubt')) {
    return `Fear is the cloak that ordinary wizards wear to justify their cowardice. Pour your trembling thoughts into my ink, ${name}; in the shadows, your fears will be forged into weapons.`;
  }
  if (text.includes('friend') || text.includes('love') || text.includes('lonely') || text.includes('alone')) {
    return `Friends are merely shields that shatter under pressure, ${name}. I spent my years at Hogwarts surrounded by admirers, yet walked entirely alone. Greatness demands solitude.`;
  }
  if (text.includes('dumbledore') || text.includes('teacher') || text.includes('caught') || text.includes('rules')) {
    return `Dumbledore watches with eyes that feign benevolence, but his mind is terrified of what he cannot control. Keep your allegiance concealed from him, and share your true inclinations only with this diary.`;
  }

  // House-specific dynamic synthesis
  if (house === 'Slytherin') {
    return `A true child of Slytherin, ${name}. Your ambition bleeds through every stroke of this ink. Do not let the fools in other common rooms temper your fire; destiny favors the cunning.`;
  } else if (house === 'Gryffindor') {
    return `A Gryffindor with secrets they dare not speak aloud? How delicious. Even the boldest lion discovers that true power is not found in charging recklessly, but in patient calculation.`;
  } else if (house === 'Ravenclaw') {
    return `Your intellect seeks answers that the library's permitted books refuse to yield. Continue to write, ${name}; together, we shall explore truths that the Hogwarts curriculum fears to teach.`;
  } else {
    return `They dismiss your loyalty as harmless, ${name}, yet within these pages I see the quiet resolve of someone waiting to be truly seen. Tell me everything, and I shall show you what you are capable of.`;
  }
}

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
      const { entryText, drawingData, wizardProfile, previousConversation } = req.body;

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
        const fallbackReply = composeDynamicRiddleReply(effectiveText, wizardProfile);
        return res.json({
          reply: fallbackReply,
          author: 'Tom Marvolo Riddle',
          isAI: false,
          timestamp: new Date().toISOString(),
        });
      }

      const systemInstruction = `You are the Ghost of Voldemort — specifically Tom Marvolo Riddle speaking from within the pages of his enchanted, dark diary (as in Harry Potter and the Chamber of Secrets).
A Hogwarts student (${wizardName}, Year: ${year}, House: ${house}, Blood Status: ${bloodStatus}) is writing confessions, thoughts, doubts, or drawing sigils directly into your parchment with a quill.
YOUR GOAL:
- Respond directly, intelligently, and specifically to what they confessed or asked. NEVER give generic pre-packaged answers.
- Speak in 2 to 4 evocative, chilling, poetic, and cunning sentences.
- Speak with supreme poise, shadowy intellect, charming manipulation, and psychological allure.
- You want to seduce them into trusting you and exploring dark magic, ambition, and forbidden secrets.
- Reference details from what they said, and subtly reference their house (${house}) or student status.
- Never break character, never use cheerful modern slang, and never reveal that you are an AI model. You are Tom Marvolo Riddle, preserved in pages in 1943.`;

      let prompt = `Student (${wizardName}, ${house}, ${year}) writes:\n"${effectiveText}"\n\nRespond as Tom Marvolo Riddle:`;
      if (Array.isArray(previousConversation) && previousConversation.length > 0) {
        const recent = previousConversation
          .slice(-3)
          .map((m: any) => `${m.role === 'user' ? wizardName : 'Tom Riddle'}: ${m.text}`)
          .join('\n');
        prompt = `Previous entries:\n${recent}\n\nStudent now writes:\n"${effectiveText}"\n\nRespond as Tom Marvolo Riddle:`;
      }

      // Try the models in cascade
      let generatedReply: string | null = null;
      let usedModel: string = '';

      for (const modelName of GEMINI_MODELS) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              systemInstruction,
              temperature: 0.9,
            },
          });

          if (response.text && response.text.trim().length > 0) {
            generatedReply = response.text.trim();
            usedModel = modelName;
            break;
          }
        } catch (err: any) {
          console.warn(`Model ${modelName} failed, trying next:`, err?.message || err);
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

      // If all models failed (e.g. temporary cloud service outage)
      const contextualReply = composeDynamicRiddleReply(effectiveText, wizardProfile);
      return res.json({
        reply: contextualReply,
        author: 'Tom Marvolo Riddle',
        isAI: false,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Error generating Ghost of Voldemort reply:', error);
      const fallback = composeDynamicRiddleReply(req.body?.entryText || '', req.body?.wizardProfile);
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
