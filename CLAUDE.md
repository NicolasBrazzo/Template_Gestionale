# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ECE Corriere Espresso** — a delivery management system (gestionale) with a React frontend and an Express/Node.js backend. Both are in the same repo under `client/` and `server/`.

---

## Commands

### Client (`client/`)
```bash
npm run dev       # Start Vite dev server
npm run build     # Production build
npm run lint      # ESLint
npm run preview   # Preview production build
```

### Server (`server/`)
```bash
npm run dev       # Start with nodemon (hot reload)
npm start         # Start without hot reload (node server.js)
```

There are no tests in either project.

---

## Environment Variables

**`client/.env`**
```
VITE_API_URL=http://localhost:3000
```

**`server/.env`** (required)
```
PORT=3000
SUPABASE_URL=
SUPABASE_KEY=
JWT_SECRET=
JWT_EXPIRES_IN=
FRONTEND_URL=http://localhost:5173
```

---

## Architecture

### Client (`client/src/`)

**Routing** (`App.jsx`): React Router v7. Public routes: `/` (Login), `/delivery-track`. Protected routes under `PrivateRoute`: `/dashboard`, `/clients`, `/deliveries`, `/users` (admin only).

**Auth flow** (`context/AuthContext.jsx`): JWT stored in `localStorage`. An Axios request interceptor in `api/client.js` automatically attaches the `Bearer` token to every request. On mount, `AuthContext` calls `GET /auth/me` to restore session. The JWT payload contains `{ sub, email, isAdmin }`.

**Data fetching**: TanStack React Query v4 throughout. Each page uses `useQuery` for reads and calls service functions + `queryClient.invalidateQueries` for mutations (no `useMutation`).

**Service layer** (`services/`): Thin wrappers over the Axios client. Each service file maps to one resource (`clientsService`, `deliveriesService`, `userService`). The Axios client in `api/client.js` normalizes errors — always check `err.message` on the frontend, not `err.response`.

**UI components** (`components/ui/`): shadcn-style components built with CVA + Tailwind v4. Available: `Button`, `Input`, `Label`, `Badge`, `Textarea`, `Select` (native wrapper). The `Badge` component has delivery-specific variants: `warning`, `info`, `indigo`, `success`, `muted`.

**Styling**: Tailwind CSS v4 with OKLCH CSS variables. Design tokens are in `index.css` as `:root` variables (`--background`, `--card`, `--border`, `--muted`, `--primary`, etc.). Always use semantic token classes (`bg-card`, `text-muted-foreground`, `border-border`) rather than hardcoded Tailwind colors (`bg-white`, `text-gray-500`).

**Delivery statuses**: `da_ritirare` | `in_deposito` | `in_consegna` | `consegnato` | `in_giacenza`. Both `Deliveries.jsx` and `DeliveryTrack.jsx` define a `STATUS_CONFIG` map — keep them in sync if statuses change.

### Server (`server/`)

**Layered architecture**: `server.js` → `controllers/` (Express routers) → `models/` (Supabase queries) → `config/db_connection.js` (single Supabase client).

**Database**: Supabase (PostgreSQL). Tables: `ECE_Deliveries`, `ECE_Clients`, `ECE_Users`. All DB access goes through `@supabase/supabase-js` in the model files — never raw SQL.

**Auth middleware** (`middleware/auth.js`): Verifies JWT and attaches `req.user` (decoded payload). Applied per-route with `protect`. The `/deliveries/track` endpoint is intentionally public (no `protect`).

**API response shape**: All routes return `{ ok: true, <resource> }` on success. Errors return `{ ok: false, error: "<message>" }`. The client Axios interceptor extracts `response.data.error` for display.

**`delivery_key`**: Auto-generated random string (`Math.random().toString(36)`) at creation time — not editable by the user.

---

## Key Patterns

- **Adding a new shadcn component**: Create it in `client/src/components/ui/` following the existing pattern (CVA + `cn()` from `@/lib/utils`). Import `Slot` from `"radix-ui"`, other primitives from `"radix-ui"` as well.
- **Page padding**: All protected pages use `px-6 py-6` as the outer wrapper padding.
- **Table structure**: `rounded-lg border bg-card shadow-sm` container → `bg-muted/50` header row → `divide-y divide-border` on `<tbody>`.
- **Form fields**: `<Label>` + `<Input>` (or `<Select>`, `<Textarea>`) wrapped in `<div className="space-y-1.5">`.
- **Error display**: `rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive` block for page-level errors; inline `text-sm text-destructive font-medium` for form errors.
