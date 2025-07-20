# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Cultural Sound Lab (CSL)** is an innovative platform that enables musicians and cultural communities to monetize traditional and cultural music through AI-powered generation, licensing, and creative tools. The platform transforms authentic cultural recordings into usable assets for businesses, content creators, and cultural enterprises while ensuring fair compensation and cultural respect.

### Relationship with Traditional Sound Rights Registry (TSRR)

- **TSRR**: Acts as the underlying database and rights management system
- **CSL**: The user-facing platform that consumes TSRR data and provides creative tools
- **Current MVP**: Uses 8 sample Mizo audio files as mock TSRR data

**Current Status**: MVP implementation complete with functional web application, API backend, and mock generation services ready for demo. All TypeScript build errors have been resolved and the codebase passes type checking across all packages. Sentry monitoring integration complete with error tracking and performance monitoring fully configured for production deployment.

## Core Features

### 1. Audio Library & Browsing
- Display available cultural instruments/sounds
- Metadata viewing (origin, cultural context, usage rights)
- Preview player with waveform visualization
- Search and filter by culture, instrument type, mood

### 2. AI Music Generation Engine
- **Style Transfer**: Generate new compositions from uploaded samples
- **Mood-Based Generation**: Create music for specific atmospheres (chill, energetic, ceremonial)
- **Length Extension**: Extend short samples into full tracks
- **Instrument Layering**: Combine multiple traditional instruments intelligently

### 3. Business Audio Solutions
- **Sound Logos**: 3-15 second branded audio signatures
- **Playlist Generator**: Curated background music for shops/spaces
- **Social Media Clips**: 15-60 second clips optimized for reels/stories
- **Long-Form Content**: Documentary scores, film music, ambient tracks

### 4. Licensing & Monetization
- Clear licensing tiers (Personal, Commercial, Enterprise)
- Smart contract integration for automatic royalty distribution
- Usage tracking and analytics
- Revenue split transparency

### 5. Cultural Context Preservation
- Each sound includes cultural story/significance
- Mandatory attribution system
- Cultural usage guidelines
- Community approval workflows

## Technical Architecture

### Frontend Stack
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- Framer Motion for animations
- Tone.js for audio playback/manipulation
- WaveSurfer.js for waveform visualization
- React Query for data fetching
- Zustand for state management

### Backend Stack
- Node.js with Express.js
- Supabase (PostgreSQL for metadata, user data, licensing)
- MinIO/S3 (audio file storage)
- In-memory queue (job processing)
- Stripe (payments)

### AI/Audio Processing
- Python FastAPI service
- Audiocraft (Meta's music generation)
- Demucs (source separation)
- PyDub (audio manipulation)
- TensorFlow/PyTorch (custom models)
- FFmpeg (audio conversion)

### Current Monorepo Structure
- **Framework**: Turborepo with npm workspaces
- **Package Manager**: npm@11.3.0
- **Node.js**: >=18 required
- **Language**: 100% TypeScript
- **Styling**: Tailwind CSS 4.1.5

### Current Applications
- `apps/web/` - Next.js 15.3.0 web application with complete dashboard, authentication, and generation workflows
- `apps/ai/` - Empty placeholder for AI processing services (mock generation implemented in API)
- `apps/api/` - Express.js backend with Supabase integration, generation queues, and demo endpoints

### Current Shared Packages
- `packages/ui/` - React component library with Tailwind CSS
- `packages/cultural-metadata/` - Empty placeholder for cultural data structures
- `packages/shared/` - Empty placeholder for common utilities
- `packages/eslint-config/` - Shared ESLint configurations
- `packages/typescript-config/` - Shared TypeScript configurations
- `packages/tailwind-config/` - Shared Tailwind CSS setup

### Asset Directories
- `assets/cultural-context/mizo/` - Empty placeholder for Mizo cultural context data
- `assets/sample-audio/` - Contains 8 Mizo audio files (.mp4) and metadata JSON file
- `assets/demo-audio/` - Contains demo generated audio files and playlist for testing

## Target Project Structure

```
cultural-sound-lab/
├── apps/
│   ├── web/                    # Next.js frontend
│   │   ├── app/
│   │   │   ├── (auth)/         # Authentication pages
│   │   │   ├── (dashboard)/    # Main application pages
│   │   │   └── api/           # API routes
│   │   ├── components/
│   │   │   ├── ui/            # shadcn components
│   │   │   ├── audio/         # Audio-specific components
│   │   │   ├── generation/    # AI generation components
│   │   │   └── cultural/      # Cultural context components
│   │   ├── lib/               # Utilities and API client
│   │   ├── hooks/             # Custom React hooks
│   │   └── styles/            # Global styles
│   │
│   ├── api/                   # Express.js backend
│   │   ├── src/
│   │   │   ├── controllers/   # Route handlers
│   │   │   ├── services/      # Business logic
│   │   │   ├── models/        # Data models
│   │   │   ├── middleware/    # Express middleware
│   │   │   └── queues/        # Job processing
│   │   └── prisma/           # Database schema
│   │
│   └── ai/                    # Python AI service
│       ├── app/
│       │   ├── api/          # FastAPI endpoints
│       │   ├── models/       # AI model implementations
│       │   └── services/     # AI processing services
│       └── notebooks/        # Jupyter notebooks
│
├── packages/
│   ├── shared/               # Shared types and utilities
│   └── cultural-metadata/    # Cultural context definitions
│
├── assets/
│   ├── sample-audio/         # 8 Mizo sample files for MVP
│   └── cultural-context/     # Cultural context data
│
├── scripts/                  # Setup and utility scripts
└── docs/                    # Documentation
```

## API Endpoints

### Authentication
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
```

### Audio Library
```
GET    /api/audio/samples
GET    /api/audio/samples/:id
POST   /api/audio/upload          (admin only)
GET    /api/audio/preview/:id
```

### Generation
```
POST   /api/generate/sound-logo
POST   /api/generate/playlist
POST   /api/generate/social-clip
POST   /api/generate/long-form
GET    /api/generate/status/:id
GET    /api/generate/download/:id
```

### Licensing
```
POST   /api/license/create
GET    /api/license/my-licenses
GET    /api/license/verify/:id
POST   /api/license/payment
```

### Analytics
```
GET    /api/analytics/earnings
GET    /api/analytics/usage
GET    /api/analytics/cultural-impact
```

## Database Schema

### Core Tables
- `users` - User authentication and profiles
- `audio_samples` - Cultural audio samples with metadata
- `generations` - AI-generated audio tracks
- `licenses` - Usage licenses and permissions
- `revenue_splits` - Automatic royalty distribution

## Development Commands

### Root Level Commands (run from project root)
```bash
npm run dev          # Start all development servers
npm run build        # Build all packages and applications
npm run lint         # Run ESLint across all packages
npm run check-types  # Run TypeScript type checking (web + ui packages)
# Note: API package uses: npm run type-check --workspace=@cultural-sound-lab/api
npm run format       # Format code with Prettier

# Target commands for full stack
npm run dev:web      # Start Next.js frontend
npm run dev:api      # Start Express.js backend
npm run dev:ai       # Start Python AI service
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database with sample data
```

### Web Application (apps/web/)
The web app runs on port 3001 by default. Features complete dashboard with:
- Landing page with interactive demo
- Authentication (login/register)
- Audio library browsing with metadata
- AI generation workflows (sound logos, playlists, social clips, long-form)
- Health monitoring dashboard
- User earnings and project management
- **Complete Sentry integration** with error boundaries and performance tracking

### UI Package Build Commands
```bash
# From packages/ui/ directory
npm run build:styles     # Build Tailwind CSS
npm run build:components # Build TypeScript components
npm run dev:styles       # Watch mode for styles
npm run dev:components   # Watch mode for components
```

## Key Technologies

### Current Stack
- **Next.js 15.3.0** with App Router
- **React 19.1.0**
- **TypeScript 5.8.2**
- **Tailwind CSS 4.1.5**
- **Turborepo 2.5.4**

### Target Stack
- **Frontend**: Next.js 14 + shadcn/ui + Framer Motion + Tone.js + WaveSurfer.js
- **Backend**: Node.js + Express.js + Supabase + MinIO/S3
- **AI Service**: Python + FastAPI + Audiocraft + Demucs + PyDub
- **Payments**: Stripe integration
- **Queue System**: In-memory queue for job processing

## Testing

No testing framework is currently configured. When implementing tests, you will need to:
1. Choose and configure a testing framework (Jest, Vitest, etc.)
2. Add test scripts to package.json files
3. Update turbo.json to include test tasks

## Cultural Considerations

### Cultural Sensitivity
- All generated content must respect cultural origins
- Clear attribution requirements
- Community approval for certain uses
- Educational context always included

### Legal Framework
- Smart contracts for automatic royalties
- Clear usage rights definition
- International copyright compliance
- Cultural heritage protection

## Environment Variables

```env
# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_STORAGE_URL=http://localhost:9000

# Backend
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
JWT_SECRET=your-secret-key
STRIPE_SECRET_KEY=sk_test_...

# Monitoring (Sentry)
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_AUTH_TOKEN=your-sentry-auth-token
SENTRY_ORG=cultural-sound-lab
SENTRY_PROJECT=your-project-name
SENTRY_ENVIRONMENT=development

# Storage
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=cultural-audio

# AI Service
AI_SERVICE_URL=http://localhost:8000
MODEL_PATH=/models/audiocraft
```

## Development Notes

- The project uses Turborepo's task dependency system defined in `turbo.json`
- UI components use a `ui-` prefix for Tailwind classes to avoid conflicts
- All packages are configured to use shared ESLint and TypeScript configurations
- The web app transpiles UI components directly using Next.js `transpilePackages`
- TypeScript strict mode is enabled and all packages pass type checking without errors
- Type safety has been implemented across components, hooks, and API interfaces
- **Sentry monitoring** is fully integrated with proper instrumentation files and error boundaries
- **Production ready** with complete error tracking and performance monitoring

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1)
- Set up monorepo structure
- Initialize Next.js and Express apps
- Configure databases and storage
- Implement authentication

### Phase 2: Audio Management (Week 2)
- Upload and preview functionality
- Metadata management
- Basic audio player
- Storage integration

### Phase 3: AI Integration (Week 3)
- Python service setup
- Basic generation endpoints
- Queue system for processing
- Result delivery

### Phase 4: Business Features (Week 4)
- Sound logo generator
- Playlist creator
- Licensing system
- Payment integration

### Phase 5: Polish & Launch (Week 5)
- UI/UX refinement
- Testing & bug fixes
- Documentation
- Deployment

## Port Configuration

- Web app: http://localhost:3001 (current)
- API backend: http://localhost:3001 (current, implemented)
- AI service: http://localhost:8000 (target, mock endpoints implemented)
- Database: Supabase cloud (current)
- MinIO: localhost:9000 (target)
- Sentry monitoring: Fully configured with production DSNs