# Cyber Advisory Dashboard

Personal working dashboard for a cybersecurity advisory associate. Built with Next.js 14, TypeScript, and Tailwind CSS. Deployed on Vercel.

## Pages

| Page | Path | Description |
|------|------|-------------|
| Overview | `/` | Summary: tasks, client contacts, engagement progress, deliverables, CPD strip |
| Engagements | `/engagements` | Add / edit / track all client engagements |
| Clients | `/clients` | Contact directory linked to engagements |
| Deliverables | `/deliverables` | Checklist of formal outputs per engagement |
| CPD log | `/cpd` | Log and track continuing professional development hours |

## Data storage

All data is stored in the browser's `localStorage`. No backend, no database. Data persists across sessions on the same browser. Seed data is loaded on first visit automatically.

To reset to seed data, clear `localStorage` in DevTools → Application → Local Storage.

## Getting started

```bash
# Install dependencies
npm install

# Run dev server
npm run dev
# Open http://localhost:3000
```

## Deploy to Vercel

```bash
# Install Vercel CLI (one-time)
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

Vercel auto-detects Next.js. No extra config needed.

## Extending

- **Add a page**: create `src/app/<name>/page.tsx` and add it to `src/components/Sidebar.tsx`
- **Add a field**: update `src/lib/types.ts`, `src/lib/seeds.ts`, and the relevant page form
- **Multi-device sync**: replace `localStorage` calls in `src/lib/storage.ts` with Vercel KV or Supabase
