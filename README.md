# OnlyScholars

> A credibility-based research sharing platform that combines academic rigor with social engagement.

## Table of Contents

- [Core Features](#core-features)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [Acknowledgements](#acknowledgements)
- [License](#license)

## Core Features

### Research Platform Features
- **Credibility Scoring System**
  - Dynamic user reputation scoring
  - Weighted voting based on expertise
  - Research domain validation
- **Content Management**
  - Rich text editor with markdown support
  - Infinite scroll feed with real-time updates
  - Subreddit-style research communities
  - Nested comment discussions
- **Academic Integration**
  - Research domain tagging
  - Citation metrics
  - Expert verification system
  - Academic credential validation

### Technical Features
- **Modern Web Architecture**
  - Server-side rendering with Next.js 13+
  - Real-time updates via React Query
  - Type-safe development with TypeScript
  - Responsive design with Tailwind CSS
- **User Experience**
  - Dark/Light mode support
  - Infinite scrolling
  - Real-time credibility updates
  - Optimistic UI updates
- **Performance**
  - Server-side rendering
  - Efficient data caching
  - Optimized image loading
  - Minimal bundle size

## Technology Stack

### Frontend
- Next.js 13+ with App Router
- TypeScript for type safety
- Tailwind CSS for styling
- Shadcn/UI components
- EditorJS for rich text
- React Query for data management

### Backend
- Next.js API Routes
- Prisma ORM with SQLite
- NextAuth for authentication
- Role-based access control
- Real-time event system

### Development Tools
- pnpm package manager
- ESLint & Prettier
- GitHub Actions CI/CD
- Zod for validation

## Getting Started

1. Clone and install:
   ```bash
   git clone https://github.com/yourusername/onlyscholars.git
   cd onlyscholars
   pnpm install
   ```

2. Configure environment:
   ```bash
   cp .env.example .env.local
   # Update environment variables
   ```

3. Initialize database:
   ```bash
   pnpm prisma generate
   pnpm prisma db push
   ```

4. Start development:
   ```bash
   pnpm dev
   ```

## Project Structure

```
src/
├── app/             # Next.js pages & API routes
├── components/      # React components
├── lib/            # Utilities & helpers
├── server/         # Server-side logic
├── styles/         # Global styles
└── types/          # TypeScript types
prisma/
└── schema.prisma   # Database schema
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## Acknowledgements

- Built on the foundation of modern web technologies
- Inspired by academic publishing platforms
- Thanks to the open source community

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Built with ❤️ for advancing research collaboration
