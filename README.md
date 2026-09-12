# MAKELE Frontend + Backend Integration

## Setup

1. Install dependencies.

```bash
npm install
```

2. Copy environment file.

```bash
cp .env.example .env.local
```

3. Start dev server.

```bash
npm run dev
```

## Fast Switch: Mock Mode vs Real Backend

Use these env flags in `.env.local` for instant switching during client demos.

You can also switch without editing env files:

```bash
npm run dev:demo
```

```bash
npm run dev:real
```

### Mock / Demo Mode (safe for in-progress backend)

```env
USE_MOCK_PRISMA="true"
NEXT_PUBLIC_USE_MOCK_UI="true"
NEXT_PUBLIC_ENABLE_DEMO_AUTH="true"
ENABLE_DEMO_AUTH="true"
```

### Real Backend Integration Mode

```env
USE_MOCK_PRISMA="false"
NEXT_PUBLIC_USE_MOCK_UI="false"
NEXT_PUBLIC_ENABLE_DEMO_AUTH="false"
ENABLE_DEMO_AUTH="false"
DATABASE_URL="postgresql://..."
JWT_SECRET="..."
```

Then restart dev server after env changes.

## Database (Real Backend Mode)

```bash
npx prisma migrate dev
npx prisma db seed
```

## Notes

- Public pages are being migrated to API-driven fetching (`/api/*`) so frontend and backend integration remains consistent.
- While backend features are still in progress, keep `NEXT_PUBLIC_USE_MOCK_UI="true"` to show complete UI sections with mock placeholders.
