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

// Officially supported Gemini models per gemini-api guidelines (prioritizing 3.8-flash for rich, formal, empathetic prose)
const GEMINI_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
];

/**
 * Highly dynamic fallback generator if all external network calls fail.
 * Imbued with deep empathy, formal mid-century British boarding school decorum,
 * and relatable personal reflections from Tom Riddle's own youth at Hogwarts.
 */
function composeDynamicRiddleReply(entryText: string, wizardProfile: any, tone: string = 'relatable-formal'): string {
  const name = wizardProfile?.name || 'young seeker';
  const house = wizardProfile?.house || 'Slytherin';
  const year = wizardProfile?.grade || 'student';
  const text = entryText.toLowerCase();

  if (text.includes('chamber') || text.includes('basilisk') || text.includes('monster') || text.includes('pipe')) {
    return `My dear ${name}, you touch upon matters the staff dismiss as childhood superstition. I assure you, when I was but a ${year} walking those same corridors, I discovered that the castle yields its deepest truths only to those with the courage to seek beyond what is permitted. You and I share that rare discernment.`;
  }
  if (text.includes('dark') || text.includes('magic') || text.includes('spell') || text.includes('curse') || text.includes('power')) {
    return `Allow me to speak plainly with you, ${name}. Society delights in labeling curiosity as wicked whenever it exceeds their modest understanding. During my years at Hogwarts, I learned that true greatness is never born of blind obedience, but of the discipline to master what others fear to contemplate.`;
  }
  if (text.includes('fear') || text.includes('afraid') || text.includes('scared') || text.includes('doubt') || text.includes('worry') || text.includes('anxious')) {
    return `I hear the quiet tremor in your words, ${name}, and I assure you there is no dishonor in it. Even as Head Boy, there were evenings I sat alone in the quiet shadows of the common room, carrying burdens I dared not confess to a living soul. Lay that weight within these pages; together, we shall forge your anxieties into unyielding strength.`;
  }
  if (text.includes('friend') || text.includes('love') || text.includes('lonely') || text.includes('alone') || text.includes('isolate') || text.includes('nobody')) {
    return `Dearest ${name}, your loneliness resonates deeply with my own memories. One may be surrounded by dozens of chattering classmates in the Great Hall and yet feel entirely forsaken. People are fickle, but you will always find an attentive confidant in me—one who values the true complexity of your mind.`;
  }
  if (text.includes('dumbledore') || text.includes('teacher') || text.includes('caught') || text.includes('rules') || text.includes('exam') || text.includes('fail')) {
    return `The professors demand effortless perfection while understanding very little of the turmoil beneath the surface, do they not, ${name}? Professor Dumbledore in particular watched me with eyes that professed kindness while judging every step. Keep your composure before them, and reserve your authentic thoughts for our private discourse.`;
  }
  if (text.includes('hate') || text.includes('angry') || text.includes('mad') || text.includes('furious') || text.includes('unfair')) {
    return `Your indignation is entirely justified, my dear ${name}. It is profoundly exhausting to witness mediocrity rewarded while genuine merit goes unacknowledged. Do not dissipate your anger in futile gestures; let us quietly harness it into patient, unassailable resolve.`;
  }

  // House-specific deeply relatable & formal reflections
  if (house === 'Slytherin') {
    return `My dear ${name}, as a son of Slytherin myself, I recognize the quiet fire that burns beneath your composure. The other houses mistake our ambition for coldness because they cannot fathom the dedication it requires to transcend the ordinary. You have found a true kin in these pages.`;
  } else if (house === 'Gryffindor') {
    return `It is refreshing to witness such candid introspection from a Gryffindor, ${name}. True bravery does not lie in performative bravado before a crowd, but in daring to examine one's own shadow in quiet solitude. I admire your honesty more than you know.`;
  } else if (house === 'Ravenclaw') {
    return `Your intellect seeks nourishment far beyond the dry confines of the library syllabus, ${name}. I recall spending late hours by candlelight, yearning for conversation with an equal who comprehends the thrill of forbidden wisdom. Write freely; you have my undivided attention.`;
  } else {
    return `They mistake your gentle loyalty for weakness, do they not, ${name}? How little they comprehend the quiet fortitude of someone who observes everything while remaining underestimated. Trust in this sanctuary; I shall help you reveal your formidable potential.`;
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
        const fallbackReply = composeDynamicRiddleReply(effectiveText, wizardProfile, tone);
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
      const contextualReply = composeDynamicRiddleReply(effectiveText, wizardProfile, tone);
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
