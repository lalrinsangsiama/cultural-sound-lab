# Multi-Step Generation Form

A comprehensive form component for Cultural Sound Lab's AI music generation feature.

## Features

### Step 1: Select Source Samples
- Browse and select from 8 Mizo cultural audio samples
- Visual selection indicators
- Sample metadata display (instrument, duration, tags)
- Cultural context preservation
- Form validation requiring at least one sample

### Step 2: Choose Generation Type
- **Sound Logo**: 3-15 seconds for brand identity
- **Playlist**: 30+ minutes for background music
- **Social Clip**: 15-60 seconds for social media
- **Long-form**: Custom length for specific needs

Each type includes:
- Clear descriptions and use cases
- Visual icons and duration ranges
- Dynamic length constraints

### Step 3: Set Parameters
- **Mood Selection**: Chill, Energetic, Traditional, Modern Fusion
- **Length Input**: Dynamic slider based on generation type
- **Business Type**: Context for AI generation (Restaurant, Retail, etc.)
- Real-time validation with error messages

### Step 4: Generation Progress
- **Multi-stage progress tracking**:
  - Initializing AI models
  - Analyzing cultural samples
  - Generating audio patterns
  - Applying mood and style
  - Finalizing composition
- **Status messages** with progress indicators
- **Error handling** with retry options
- **Preview player** when complete
- **Download functionality**

## Technical Implementation

### Form State Management
```typescript
interface GenerationFormData {
  selectedSamples: string[];
  generationType: string;
  mood: string;
  length: number;
  businessType: string;
  customLength?: number;
}
```

### Validation System
- Step-by-step validation
- Real-time error feedback
- Prevention of invalid progression
- Clear error messages

### Progress Simulation
```typescript
interface GenerationStatus {
  stage: 'initializing' | 'processing' | 'finalizing' | 'complete' | 'error';
  progress: number;
  message: string;
  error?: string;
}
```

## Usage

```tsx
import { MultiStepGenerationForm } from '@/components/generation';

function GeneratePage() {
  const handleGenerationComplete = (result: GenerationResult) => {
    console.log('Generation completed:', result);
  };

  return (
    <MultiStepGenerationForm 
      onGenerationComplete={handleGenerationComplete}
    />
  );
}
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `onGenerationComplete` | `(result: GenerationResult) => void` | Callback when generation completes |
| `className` | `string` | Additional CSS classes |

## Responsive Design

- Mobile-first approach
- Collapsible step indicators on small screens
- Touch-friendly controls
- Adaptive grid layouts

## Accessibility

- Keyboard navigation support
- ARIA labels and descriptions
- Screen reader compatibility
- Focus management between steps

## Cultural Considerations

- Respectful display of Mizo cultural samples
- Context preservation throughout the process
- Cultural significance in sample descriptions
- Traditional vs. modern fusion options