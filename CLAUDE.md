# GymProLuxe — Project Guide

## Project Overview
Fitness PWA + Admin Panel + Backend API monorepo.

## Tech Stack
- **PWA + Admin:** Next.js 15, TypeScript, Tailwind CSS v4, Shadcn/ui
- **API:** Express, TypeScript, Prisma, PostgreSQL
- **Monorepo:** Turborepo with npm workspaces

## Quick Start
```bash
npm run dev          # Start all 3 apps (PWA:3000, Admin:3001, API:5000)
npm run db:studio    # Open Prisma database browser
npm run db:migrate   # Run database migrations
```

## Project Structure
```
apps/web/       → PWA (port 3000)
apps/admin/     → Admin Panel (port 3001)
apps/api/       → Backend API (port 5000)
packages/shared/    → Shared types, validation (Zod), constants
packages/database/  → Prisma schema + client
```

## Code Conventions
- Use TypeScript strict mode everywhere
- Tailwind CSS v4 syntax: `@import "tailwindcss"` + `@theme {}`
- Zod for all validation (shared between frontend and backend)
- API responses follow `ApiResponse<T>` wrapper type from `@gympro/shared`
- Use `cn()` utility for conditional class merging

## Design Review
Run `/design-review` to perform a full visual QA of the apps using the design review agent.

- **Agent config:** `.claude/agents/design-review-agent.md`
- **Command:** `.claude/commands/design-review.md`
- **Design principles:** `context/design-principles.md`
- **Reports saved to:** `docs/reviews/`

The design review agent uses Playwright MCP to navigate the running apps, take screenshots at multiple viewports, and generate a detailed report covering visual consistency, responsiveness, accessibility, and interaction states.
