# Cultural Sound Lab - MVP Web Application

A Next.js 14 application for monetizing traditional and cultural music through AI-powered generation, licensing, and creative tools.

## 🚀 Features

### ✅ Completed
- **Next.js 14** with App Router
- **TypeScript** configuration
- **Tailwind CSS** with custom Cultural Sound Lab branding
- **shadcn/ui** components
- **Authentication** (login/register pages)
- **Dashboard Layout** with sidebar navigation
- **Audio Library** with grid layout for cultural samples
- **AI Generation Interface** with form controls
- **Audio Players** with Tone.js integration and effects
- **Project Management** page
- **Earnings Dashboard** with analytics
- **Settings & Profile** management

### 🎵 Audio Features
- **Regular Audio Player** with standard HTML5 audio controls
- **Tone.js Enhanced Player** with real-time audio effects:
  - Reverb
  - Delay
  - Low-pass filter
  - Distortion
- **Waveform Display** using WaveSurfer.js
- **Audio Upload** component (placeholder)
- **Audio Grid** for browsing samples

## 🏗️ Project Structure

```
apps/web/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication pages
│   │   ├── layout.tsx           # Auth layout with branding
│   │   ├── login/               # Login page
│   │   └── register/            # Registration page
│   ├── (dashboard)/             # Dashboard pages
│   │   ├── layout.tsx           # Dashboard layout with sidebar
│   │   ├── page.tsx             # Dashboard home
│   │   ├── library/             # Audio library
│   │   ├── generate/            # AI generation
│   │   ├── projects/            # Project management
│   │   ├── earnings/            # Earnings analytics
│   │   └── settings/            # User settings
│   ├── globals.css              # Global styles with CSS variables
│   └── layout.tsx               # Root layout
├── components/                   # React components
│   ├── audio/                   # Audio-specific components
│   │   ├── AudioPlayer.tsx      # Standard audio player
│   │   ├── ToneAudioPlayer.tsx  # Tone.js enhanced player
│   │   ├── WaveformDisplay.tsx  # Waveform visualization
│   │   ├── AudioGrid.tsx        # Audio samples grid
│   │   └── AudioUploader.tsx    # File upload component
│   └── ui/                      # shadcn/ui components
├── hooks/                       # Custom React hooks
│   ├── useAudio.ts             # Audio playback hook
│   └── useGeneration.ts        # Generation state management
├── lib/                         # Utilities and types
│   ├── api-client.ts           # API client with endpoints
│   ├── utils.ts                # Utility functions
│   └── types/
│       └── audio.ts            # Audio-related TypeScript types
├── next.config.js              # Next.js configuration
├── tailwind.config.ts          # Tailwind CSS configuration
└── tsconfig.json               # TypeScript configuration
```

## 🎨 Design System

### Colors
- **Primary**: Purple gradient (`hsl(262 83% 58%)`)
- **Brand Gradient**: Purple to Orange
- **Cultural Theme**: Warm, inviting colors representing cultural diversity

### Typography
- **Font**: Inter (Google Fonts)
- **Headings**: Bold, clear hierarchy
- **Body**: Readable, accessible contrast

## 🔧 Technology Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety and developer experience
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality React components
- **Framer Motion** - Smooth animations
- **Lucide React** - Beautiful icons

### Audio
- **Tone.js** - Web Audio API framework for real-time effects
- **WaveSurfer.js** - Audio waveform visualization
- **HTML5 Audio** - Fallback for basic playback

### State Management
- **Zustand** - Lightweight state management
- **React Hook Form** - Form handling

### Development
- **Turborepo** - Monorepo management
- **ESLint** - Code linting
- **Autoprefixer** - CSS vendor prefixes

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Open your browser**:
   Navigate to `http://localhost:3001`

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run check-types  # Run TypeScript type checking
```

## 🎵 Audio Components Usage

### Basic Audio Player
```tsx
import AudioPlayer from "@/components/audio/AudioPlayer";

<AudioPlayer
  src="/path/to/audio.mp3"
  title="Song Title"
  artist="Artist Name"
  onPlay={() => console.log("Playing")}
  onPause={() => console.log("Paused")}
/>
```

### Tone.js Enhanced Player
```tsx
import ToneAudioPlayer from "@/components/audio/ToneAudioPlayer";

<ToneAudioPlayer
  src="/path/to/audio.mp3"
  title="Enhanced Audio"
  enableEffects={true}
  autoPlay={false}
/>
```

### Waveform Display
```tsx
import WaveformDisplay from "@/components/audio/WaveformDisplay";

<WaveformDisplay
  audioUrl="/path/to/audio.mp3"
  height={128}
  waveColor="#e5e7eb"
  progressColor="#3b82f6"
  onReady={() => console.log("Waveform ready")}
/>
```

## 🔌 API Integration

The app includes a comprehensive API client with endpoints for:

- **Authentication**: Login, register, logout
- **Audio Library**: Browse samples, get previews
- **Generation**: Create AI-generated music
- **Projects**: Manage generated content
- **Licensing**: Handle usage rights
- **Analytics**: Track earnings and usage

Example usage:
```typescript
import { apiClient } from "@/lib/api-client";

// Get audio samples
const samples = await apiClient.getAudioSamples({
  culture: "mizo",
  instrument: "drum"
});

// Generate new audio
const generation = await apiClient.generateAudio({
  type: "sound-logo",
  sourceSamples: ["sample-id-1"],
  mood: "energetic",
  tempo: 120,
  duration: 15
});
```

## 🎯 Cultural Features

### Mizo Cultural Samples
The app includes sample data for traditional Mizo instruments:
- **Khuang** - Traditional drum
- **Tuibur** - Bamboo flute
- **Darbu** - Gong ensemble

### Cultural Context
Each audio sample includes:
- Cultural significance
- Origin information
- Usage guidelines
- Respectful attribution

## 🛠️ Development

### Adding New Components
1. Create component in appropriate directory
2. Export from index file if needed
3. Add to Storybook if applicable
4. Include TypeScript types

### Customizing Styles
1. Update CSS variables in `globals.css`
2. Extend Tailwind config in `tailwind.config.ts`
3. Use design tokens consistently

### Audio Integration
1. Use provided hooks for audio state
2. Handle loading states appropriately
3. Include error boundaries
4. Test across browsers

## 📱 Responsive Design

The application is fully responsive with:
- **Mobile-first** design approach
- **Responsive navigation** (sidebar collapses on mobile)
- **Touch-friendly** audio controls
- **Adaptive layouts** for different screen sizes

## 🔊 Audio Browser Support

- **Chrome/Edge**: Full Tone.js and Web Audio API support
- **Firefox**: Full support with minor performance differences
- **Safari**: Good support, some Web Audio limitations
- **Mobile browsers**: HTML5 audio fallback for better compatibility

## 🌍 Cultural Considerations

The platform is designed with cultural sensitivity in mind:
- **Respectful representation** of traditional music
- **Clear attribution** requirements
- **Cultural context** preservation
- **Community approval** workflows (planned)
- **Fair monetization** for cultural creators

## 📈 Performance

- **Code splitting** with Next.js dynamic imports
- **Lazy loading** for audio components
- **Optimized images** and assets
- **Efficient state management**
- **Progressive enhancement** for audio features

## 🚀 Deployment

The app is ready for deployment on:
- **Vercel** (recommended for Next.js)
- **Netlify**
- **AWS Amplify**
- **Docker containers**

### Environment Variables
```env
NEXT_PUBLIC_API_URL=https://your-api-url.com
```

## 🤝 Contributing

1. Follow the existing code style
2. Use TypeScript for type safety
3. Include tests for new features
4. Respect cultural considerations
5. Update documentation

## 📄 License

This project is part of the Cultural Sound Lab platform for preserving and monetizing traditional music respectfully.