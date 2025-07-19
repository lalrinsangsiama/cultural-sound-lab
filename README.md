# Cultural Sound Lab (CSL)

Cultural Sound Lab is an innovative platform that enables musicians and cultural communities to monetize traditional and cultural music through AI-powered generation, licensing, and creative tools. The platform transforms authentic cultural recordings into usable assets for businesses, content creators, and cultural enterprises while ensuring fair compensation and cultural respect.

## 🎵 Current Status

**MVP Implementation Complete** - Functional web application, API backend, and mock generation services ready for demo.

### Current Applications
- **Web App** (`apps/web/`) - Complete Next.js dashboard with authentication, audio library, AI generation workflows, and user management
- **API Backend** (`apps/api/`) - Express.js server with Supabase integration, generation queues, and demo endpoints
- **AI Service** (`apps/ai/`) - Placeholder for future Python FastAPI service (mock generation implemented in API)

### Sample Data
- **8 Mizo Audio Files** - Traditional cultural music samples in `assets/sample-audio/`
- **Demo Generated Content** - Example outputs in `assets/demo-audio/`

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm 11.3.0+

### Installation

1. **Clone and install**:
   ```bash
   git clone <repository-url>
   cd cultural-sound-lab
   npm install
   ```

2. **Start development**:
   ```bash
   npm run dev
   ```

3. **Access the application**:
   - Web App: http://localhost:3001
   - API: http://localhost:3001/api

### Available Scripts

```bash
npm run dev          # Start all development servers
npm run build        # Build all packages and applications
npm run lint         # Run ESLint across all packages
npm run check-types  # Run TypeScript type checking
npm run format       # Format code with Prettier

# Individual applications
npm run dev:web      # Start Next.js frontend only
npm run dev:api      # Start Express.js backend only
```

## 🏗️ Architecture

### Monorepo Structure
```
cultural-sound-lab/
├── apps/
│   ├── web/                    # Next.js 15.3.0 frontend
│   ├── api/                    # Express.js backend
│   └── ai/                     # Python AI service (placeholder)
├── packages/
│   ├── ui/                     # React component library
│   ├── eslint-config/          # Shared ESLint configurations
│   ├── typescript-config/      # Shared TypeScript configurations
│   └── tailwind-config/        # Shared Tailwind CSS setup
├── assets/
│   ├── sample-audio/           # 8 Mizo cultural audio files
│   └── demo-audio/             # Generated demo content
└── docs/                       # Documentation
```

### Technology Stack

#### Frontend
- **Next.js 15.3.0** with App Router
- **React 19.1.0** with TypeScript 5.8.2
- **Tailwind CSS 4.1.5** + shadcn/ui components
- **Tone.js** for audio playback and effects
- **WaveSurfer.js** for waveform visualization
- **Framer Motion** for animations
- **Zustand** for state management

#### Backend
- **Node.js** with Express.js
- **Supabase** for database and authentication
- **TypeScript** for type safety
- **In-memory queue** for job processing

#### Development
- **Turborepo 2.5.4** for monorepo management
- **ESLint** and **Prettier** for code quality
- **100% TypeScript** across all packages

## 🎯 Core Features

### ✅ Implemented Features
- **Audio Library** - Browse and preview cultural audio samples with metadata
- **AI Generation Engine** - Create sound logos, playlists, social clips, and long-form content
- **Audio Players** - Standard and enhanced players with real-time effects
- **Authentication** - Complete login/register system with Supabase Auth
- **Dashboard** - User management, earnings tracking, and project overview
- **Responsive Design** - Mobile-first approach with touch-friendly controls

### 🔄 Mock Services
- **Generation Queue** - Simulated AI processing with realistic progress tracking
- **Cultural Metadata** - Sample Mizo cultural context and instrument data
- **Payment System** - Placeholder for Stripe integration

### 🚧 Planned Features
- **Python AI Service** - Real AI music generation with Audiocraft and Demucs
- **Smart Contracts** - Automatic royalty distribution
- **Cultural Approval** - Community review workflows
- **Advanced Analytics** - Usage tracking and revenue optimization

## 🎵 Cultural Focus

### Current: Mizo Traditional Music
- **Khuang** - Traditional drum samples
- **Tuibur** - Bamboo flute recordings
- **Darbu** - Gong ensemble pieces

### Cultural Sensitivity
- **Respectful Attribution** - Clear source and cultural context
- **Fair Monetization** - Revenue sharing with cultural creators
- **Educational Context** - Cultural significance preserved
- **Community Approval** - Planned workflows for cultural validation

## 🔧 Development

### Environment Setup
```env
# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001

# Backend
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
PORT=3001
```

### Package Management
This project uses **npm workspaces** with **Turborepo** for efficient monorepo management. The UI package builds compiled styles with a `ui-` prefix to avoid class conflicts.

### Code Quality
- **100% TypeScript** with strict configuration
- **ESLint** with shared configurations
- **Prettier** for consistent formatting
- **Responsive design** with mobile-first approach

## 📱 Browser Support

- **Chrome/Edge**: Full Web Audio API and Tone.js support
- **Firefox**: Complete functionality with minor performance differences
- **Safari**: Good support with some Web Audio limitations
- **Mobile**: HTML5 audio fallback for broader compatibility

## 🚀 Deployment

Ready for deployment on:
- **Vercel** (recommended for Next.js)
- **Railway** (for full-stack deployment)
- **Netlify** (frontend)
- **Heroku** (API backend)

## 📖 Documentation

- `CLAUDE.md` - Complete project guide and development instructions
- `apps/web/README.md` - Frontend application documentation
- `apps/api/README.md` - Backend API documentation
- `apps/web/components/generation/README.md` - AI generation component guide

## 🤝 Contributing

1. Follow existing TypeScript and Tailwind conventions
2. Respect cultural considerations in all features
3. Include comprehensive error handling
4. Test across multiple browsers and devices
5. Update documentation for new features

## 📄 License

Cultural Sound Lab platform for preserving and monetizing traditional music respectfully.
