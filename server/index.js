import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config({ path: '.env.local' });

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('Missing GEMINI_API_KEY in .env.local');
}

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const ensureAi = (res) => {
  if (!ai) {
    res.status(500).json({ error: 'Server is missing GEMINI_API_KEY' });
    return false;
  }
  return true;
};

const isString = (v) => typeof v === 'string';

const isModule = (m) => {
  if (!m || typeof m !== 'object') return false;
  const type = m.type;
  const allowed = ['experience', 'case_study', 'skill', 'education'];
  return (
    allowed.includes(type) &&
    isString(m.title) &&
    isString(m.unit) &&
    isString(m.description)
  );
};

const isGeneratedContent = (obj) => {
  if (!obj || typeof obj !== 'object') return false;
  return isString(obj.resume) && isString(obj.coverLetter) && isString(obj.interviewTips);
};

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/parse-linkedin', async (req, res) => {
  try {
    if (!ensureAi(res)) return;
    const rawText = String((req.body && req.body.rawText) || '');
    if (!rawText.trim()) {
      return res.status(400).json({ error: 'rawText is required' });
    }

    const prompt = `
Analyze the following raw text from a LinkedIn profile (it might be a copy-paste or a PDF export).
Extract the professional experiences, skills, education, and any significant projects/cases mentioned.

--- LINKEDIN TEXT ---
${rawText}
--- END TEXT ---

Structure the output as a list of career modules.
For each module, determine if it is an 'experience', 'case_study', 'skill', or 'education'.
Provide a concise title, the business unit/company, and a clear description of responsibilities and outcomes.

Format the response as a JSON array of objects with keys: "type", "title", "unit", "description".
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: {
                type: Type.STRING,
                enum: ['experience', 'case_study', 'skill', 'education'],
              },
              title: { type: Type.STRING },
              unit: { type: Type.STRING },
              description: { type: Type.STRING },
            },
            required: ['type', 'title', 'unit', 'description'],
          },
        },
      },
    });

    const responseText = response.text || '[]';
    let data;
    try {
      data = JSON.parse(responseText.trim());
    } catch {
      return res.status(502).json({ error: 'Invalid JSON from model' });
    }

    if (!Array.isArray(data) || !data.every(isModule)) {
      return res.status(502).json({ error: 'Model returned unexpected schema' });
    }

    return res.json(data);
  } catch (error) {
    console.error('Error parsing LinkedIn profile:', error);
    return res.status(500).json({ error: 'Failed to parse LinkedIn data.' });
  }
});

app.post('/api/generate', async (req, res) => {
  try {
    if (!ensureAi(res)) return;
    const modules = Array.isArray(req.body && req.body.modules) ? req.body.modules : [];
    const job = (req.body && req.body.job) || {};

    if (!modules.length) {
      return res.status(400).json({ error: 'modules is required' });
    }
    if (!job || !job.title || !job.description) {
      return res.status(400).json({ error: 'job title and description are required' });
    }

    const contextStr = modules
      .map(m => `[${String(m.type || '').toUpperCase()}] - ${m.title} (${m.unit}): ${m.description}`)
      .join('\n\n');

    const prompt = `
You are an expert Executive Career Coach and Resume Writer.
Below is my "Career Vault" containing my professional history, business cases, and skills.

--- MY CAREER VAULT ---
${contextStr}
--- END VAULT ---

I am applying for the following position:
Company: ${job.company || ''}
Title: ${job.title}
Job Description: ${job.description}
${job.values ? `Company Values: ${job.values}` : ''}

Your goal is to generate:
1. A tailored RESUME (Markdown format) that highlights the most relevant modules and cases from my vault that align with the target job's requirements. Use strong action verbs and quantify results where possible.
2. A PERSUASIVE COVER LETTER (Markdown format) that tells a story connecting my past business cases to the target company's current challenges.
3. INTERVIEW TIPS: Top 3 things I should highlight based on my vault specifically for this role.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            resume: {
              type: Type.STRING,
              description: 'The tailored resume in Markdown format.',
            },
            coverLetter: {
              type: Type.STRING,
              description: 'The tailored cover letter in Markdown format.',
            },
            interviewTips: {
              type: Type.STRING,
              description: 'Top 3 interview tips based on the vault.',
            },
          },
          required: ['resume', 'coverLetter', 'interviewTips'],
          propertyOrdering: ['resume', 'coverLetter', 'interviewTips'],
        },
      },
    });

    const responseText = response.text || '{}';
    let data;
    try {
      data = JSON.parse(responseText.trim());
    } catch {
      return res.status(502).json({ error: 'Invalid JSON from model' });
    }

    if (!isGeneratedContent(data)) {
      return res.status(502).json({ error: 'Model returned unexpected schema' });
    }

    return res.json(data);
  } catch (error) {
    console.error('Error generating content:', error);
    return res.status(500).json({ error: 'Failed to generate application materials.' });
  }
});

const port = Number(process.env.PORT || 3001);
app.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`);
});
