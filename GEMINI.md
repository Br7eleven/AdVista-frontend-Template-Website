# Project Instructions: advista-rewards

## Tech Stack
- **Frontend:** React (Vite), TypeScript.
- **Styling:** Tailwind CSS, PostCSS.
- **Backend/DB:** Supabase (PostgreSQL).
- **Charts:** lightweight-charts, react-financial-charts, visx.
- **Icons:** lucide-react.
- **Routing:** react-router-dom.

## Architecture
- `src/components/`: Reusable UI components.
- `src/lib/`: Core services (auth, supabase client, trading API, migrations).
- `src/pages/`: Route-level components.
- `supabase/migrations/`: SQL migration files.

## Conventions & Standards
- **TypeScript:** Strict typing required. No `any` without justification.
- **Styling:** Use Tailwind CSS utility classes. Avoid custom CSS files unless necessary.
- **State:** Use Supabase for persistence; React hooks for local/component state.
- **API:** Centralize API logic in `src/lib/`.
- **Linting:** Follow ESLint rules (`eslint.config.js`).

## Workflows
- **Development:** `npm run dev`
- **Build:** `npm run build`
- **Lint:** `npm run lint`
- **Migrations:** Managed via SQL files in `supabase/migrations/`.
