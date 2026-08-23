# BrewMate — AI Coffee Recipe Assistant

MVP web app. Generate precise coffee recipes based on beans, brew method and gear.

## Stack
- Next.js 16 (App Router) + TypeScript
- Tailwind CSS
- Anthropic API (claude-sonnet-4-6)
- localStorage for brew log (MVP — upgrade to Supabase later)
- Vercel deployment

## Setup

1. Add your Anthropic API key to `.env.local`:
   ```
   ANTHROPIC_API_KEY=your_key_here
   ```
2. `npm install`
3. `npm run dev`

## Structure

```
app/
  page.tsx              # Landing / Home
  generate/page.tsx     # Recipe form + result view
  log/page.tsx          # Brew log overview
  log/[id]/page.tsx     # Saved recipe detail
  api/generate-recipe/  # AI API route

lib/
  prompts/
    index.ts            # Route to correct prompt builder
    pourover.ts         # V60, Kalita, Chemex
    espresso.ts         # Espresso
    aeropress.ts        # AeroPress
    frenchpress.ts      # French Press
    utils.ts            # Shared: roast normalization, temp, grind notes
  brewLog.ts            # localStorage CRUD

components/ui/
  Navbar.tsx
  RecipeCard.tsx        # Metric display card
  StarRating.tsx

types/index.ts          # All TypeScript interfaces
```

## MVP Roadmap
- [x] Recipe form (all fields)
- [x] AI recipe generation (structured JSON)
- [x] Recipe result display (cards + steps)
- [x] Save to brew log
- [x] Brew log overview
- [x] Recipe detail page with editable rating/notes

## Next Steps (post-MVP)
- Supabase for persistent storage + user accounts
- Coffee bag scanning (camera → OCR → autofill)
- Recipe improvement from ratings
- Mobile / iOS app
