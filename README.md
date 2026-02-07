<<<<<<< HEAD
﻿# CareerTailor AI

CareerTailor AI is a single-page React app that helps you turn your professional history into tailored application materials. It lets you build a "Career Vault" of experiences, import LinkedIn text, and then generate a resume, cover letter, and interview tips using Gemini.

## Features
- Career Vault to store experiences, skills, education, and case studies
- LinkedIn text import with AI parsing into structured modules
- Job-targeted resume and cover letter generation
- Interview tips generated from your vault
- Local persistence via browser localStorage

## Tech Stack
- React 19 + TypeScript
- Vite 6
- Node/Express API server
- Gemini via `@google/genai`
- Tailwind (CDN) + Lucide icons

## How It Works
1. You add modules manually or import LinkedIn text.
2. Modules are stored in localStorage as `career_vault`.
3. When you provide a target job, the app sends your vault plus the job details to the backend.
4. The backend calls Gemini and returns JSON with `resume`, `coverLetter`, and `interviewTips`.
5. Results render in the UI and can be copied to clipboard.

## Project Structure
- `App.tsx` main UI and state management
- `components/CareerModuleCard.tsx` card view for vault items
- `services/geminiService.ts` client API wrapper
- `server/index.js` Gemini API proxy (keeps API key off the client)
- `types.ts` shared TypeScript types
- `index.tsx` React entry point
- `index.html` HTML shell + Tailwind CDN
- `index.css` global overrides
- `vite.config.ts` Vite config and API proxy

## Setup
Prerequisites: Node.js

1. Install dependencies
   ```bash
   npm install
   ```
2. Create `.env.local` with your Gemini API key
   ```bash
   GEMINI_API_KEY=your_key_here
   ```
3. Start the backend and frontend together
   ```bash
   npm run dev:full
   ```

Frontend runs on `http://localhost:3000`
Backend runs on `http://localhost:3001`

## Alternative Run (Separate Terminals)
Terminal 1:
```bash
npm run server
```
Terminal 2:
```bash
npm run dev
```

## Build and Preview
```bash
npm run build
npm run preview
```

## Environment Variables
- `GEMINI_API_KEY` (required): your Gemini API key (server-only)
- `PORT` (optional): backend port (default `3001`)

## Notes and Limitations
- The API key is no longer exposed to the browser. All Gemini calls are server-side.
- The LinkedIn parser expects raw text (copy-paste or PDF export). Results may need manual edits.

## Troubleshooting
- If generation fails, check the backend console for errors and verify your key.
- If the LinkedIn import returns empty results, try a smaller portion of the profile text.
=======
# career-tailor-ai
>>>>>>> c0f9e41772ff9af458ca40108453a5a0d966b6f9
