# OnlyScholars AI Development Guidelines

## Project Architecture

This is a Reddit-style platform being evolved into OnlyScholars, a credibility-based research sharing platform. Key components:

- Next.js 13+ App Router + TypeScript frontend
- Prisma ORM with SQLite database
- Authentication via NextAuth
- Real-time UI with React Query
- Tailwind CSS for styling

## Core Data Models & Flows

1. Users -> Posts -> Votes graph forms basis for credibility scoring
2. Posts support markdown/rich text via EditorJS
3. Infinite scroll feed with vote/comment functionality
4. Subreddit-style topic organization

## Key Integration Points

1. Database Schema (`prisma/schema.prisma`):
   - User/Post models extended with credibility scores
   - Vote model weighted by voter credibility

2. API Routes (`src/app/api/`):
   - POST /api/posts - Create with initial credibility
   - POST /api/vote - Update scores using weighted algorithm
   - GET /api/user/[id] - Include credibility metrics

3. Frontend Components (`src/components/`):
   - Post feed shows credibility badges
   - User profiles display reputation
   - Vote buttons apply weighted scoring

## Development Workflows

1. Database Updates:
```bash
npx prisma generate  # Update client
npx prisma db push   # Push schema changes
npx prisma studio    # Visual database explorer
```

2. Running Locally:
```bash
pnpm install
pnpm dev
```

## Critical Patterns

1. Credibility Scoring:
   - `Δpost = α * direction * log(1 + voterCred)`
   - Author reputation updated by post consensus
   - Nightly Role-RGCN graph updates

2. API Conventions:
   - Routes under `src/app/api/`
   - Error handling via custom middleware
   - Vote validation in transactions

3. Component Patterns:
   - Server/Client component split
   - React Query for data fetching
   - Shadcn/UI component system

## Integration Testing

1. Key test scenarios:
   - Vote weighting accuracy
   - Credibility propagation
   - User reputation calculations
   - Feed sorting by weighted scores

Remember: Changes should preserve Reddit-style UX while adding credibility features incrementally.