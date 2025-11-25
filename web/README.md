# Smart Uni Web

Frontend for the Smart University Communication & Venue Notification System. Plain React 19, React Router, React Query, Tailwind v4. No purple anywhere.

## Prereqs

- Node 20+
- pnpm 8+
- Backend reachable at `http://localhost:5000/api` (override with `VITE_API_URL`).

## Quick start

```bash
pnpm install
pnpm dev
```

Create a `.env` alongside `package.json` if you need a different API base:

```
VITE_API_URL=http://localhost:5000/api
```

## Production build

```bash
pnpm build
pnpm preview
```

## Notable bits

- Auth state is cached in `localStorage` under `smart-uni-auth`.
- Uses React Query for caching + refetch, with our `apiFetch` wrapper.
- Tailwind theme sticks to teal + orange, breathable cards, glass blur, no heavy gradients.
