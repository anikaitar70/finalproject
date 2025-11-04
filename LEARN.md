# OnlyScholars: A Credibility-Based Research Sharing Platform

## Feed System

The platform implements a dual-feed system to provide users with both personalized and general content:

### Feed Types

1. **Custom Feed** (`custom-feed.tsx`)
   - Shows posts from subreddits the user has subscribed to
   - Requires authentication to view personalized content
   - Ordered by post credibility and recency

2. **General Feed** (`general-feed.tsx`)
   - Displays posts from all subreddits
   - Accessible to both authenticated and anonymous users
   - Posts ordered by credibility score and timestamp

### Feed Toggle

The feed toggle component (`feed-toggle.tsx`) allows users to switch between feed types:
- Uses URL parameters to maintain feed state
- Persists feed preference during navigation
- Accessible keyboard navigation support

### Implementation Details

Feed state is managed through URL parameters:
- `/?feed=custom` - Shows subscribed subreddits
- `/?feed=general` - Shows all subreddits

Server components fetch appropriate data based on feed type, while client components handle the UI interaction and state management.
