# Aspire AI

Aspire AI is a career-intelligence web app built with Next.js. A single saved profile powers the assessment result, dashboard, roadmap and career assistant.

## Core flow

1. Complete the assessment.
2. Aspire AI calculates and saves one career-match score.
3. Dashboard reads that saved score and shows strengths, gaps and roadmap progress.
4. Roadmap reads the same profile and tracks completion separately.
5. Assistant uses the same career, score, skills, interests and roadmap progress.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## AI Assistant

The assistant has two modes:

- **Smart local mode** works immediately and does not require an API key.
- **AI mode** uses the server-side `/api/assistant` route when `OPENAI_API_KEY` is configured.

The API key is never sent to the browser.

### Enable AI mode

Create a file named `.env.local` in the project root and add:

```env
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-5.4
```

Then restart the development server:

```bash
npm run dev
```

If the provider is unavailable or the key is missing, Aspire AI automatically falls back to local mode instead of breaking the chat.

## Quality checks

```bash
npm run lint
npm run build
```

## Routes

- `/` — landing page
- `/assessment` — career assessment
- `/dashboard` — match analysis and skill gaps
- `/roadmap` — personalized roadmap and progress
- `/assistant` — personalized career assistant
- `/api/assistant` — server-side assistant endpoint
