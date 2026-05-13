---
name: frontend-from-backend
description: 'Build or extend a Next.js frontend from an existing backend API. Use when you need to map backend routes, domain models, and response shapes into frontend pages, data access, forms, and best-practice UX in this repository.'
argument-hint: 'What should the frontend cover from the backend API?'
---

# Frontend From Backend

Use this skill when turning a backend API into a frontend for this project. The goal is to derive a clean, maintainable Next.js UI from the backend contract instead of inventing duplicate structures or hard-coded assumptions.

## When to Use
- The backend already exists and the frontend needs to be built from it.
- You need to map backend routes, entities, and response shapes to pages and components.
- You want a frontend implementation that follows project conventions, type safety, and good UX defaults.
- You need to extend or replace placeholder pages with real data, forms, or navigation.

## Workflow
1. Inspect the backend surface first.
   - Read route files, tests, README notes, and any API configuration that defines prefixes, auth, or public endpoints.
   - Identify the main resources, actions, and response shapes.

2. Inspect the existing frontend structure.
   - Check the App Router pages, shared components, site config, styling approach, and any documented design system guidance.
   - Reuse existing layout, typography, and tokens before creating new abstractions.

3. Map backend capabilities to frontend surfaces.
   - Convert public endpoints into content pages, lists, details, and status views.
   - Convert authenticated endpoints into forms, dashboards, and role-aware flows.
   - Keep route names, labels, and navigation aligned with the product domain.

4. Design the frontend for maintainability.
   - Create a thin API client or server-side data layer with typed request and response models.
   - Centralize shared types, validation, and error handling.
   - Prefer small, composable components over page-specific duplication.
   - Include loading, empty, error, and not-found states where data is dynamic.

5. Build against best practices.
   - Use the existing Next.js patterns in this repo.
   - Keep components accessible and responsive.
   - Preserve consistent metadata, semantics, and content hierarchy.
   - Avoid overengineering; only add state management or abstractions when the backend surface needs them.

6. Validate the result.
   - Run the narrowest relevant checks first, usually lint, typecheck, or targeted tests.
   - Confirm the frontend renders the mapped backend data or safe placeholders correctly.
   - Fix issues in the touched slice before expanding scope.

## Decision Rules
- If the backend endpoint already exists, consume it directly rather than duplicating data in the frontend.
- If a backend response is incomplete, keep the frontend resilient with fallback UI and a clear TODO, but do not invent unsupported fields.
- If a page is still a placeholder, replace it only with content that can be justified by the backend or the product brief.
- If there is an existing component or layout pattern, reuse it before introducing a new one.

## Completion Checks
- The frontend reflects the backend domain and route structure.
- Shared types and API access are centralized enough to avoid copy-paste.
- Pages handle loading, empty, and error states where relevant.
- The implementation matches the repo’s existing styling and Next.js conventions.
- Validation passes for the touched area.

## References
- Backend route map: `../../../../backend/src/app.ts`
- Backend tests: `../../../../backend/src/__tests__/`
- Frontend pages: `../../../app/`
- Frontend config: `../../../lib/site-config.ts`
- Frontend project notes: `../../../README.md`