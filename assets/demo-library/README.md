# Demo Library

This directory contains the comprehensive demo library for Cultural Sound Lab, showcasing AI-generated traditional music across different business categories.

## Structure

```
demo-library/
├── demo-metadata.json          # Complete metadata for all demos and case studies
├── restaurant/                 # Restaurant & dining demos
│   ├── sound-logos/           # 3-15 second branding sounds
│   ├── playlists/             # 30-minute background music collections
│   ├── social-clips/          # 15-60 second social media content
│   └── long-form/             # 10-minute extended compositions
├── retail/                    # Retail & shopping demos
├── wellness/                  # Wellness & health demos
├── corporate/                 # Corporate & business demos
└── events/                    # Events & celebrations demos
```

## Business Categories

### 1. Restaurant & Dining
- **Ambient**: Subtle background music for intimate dining
- **Energetic**: Upbeat music for casual dining and social restaurants

### 2. Retail & Shopping  
- **Boutique**: Sophisticated background music for upscale retail
- **Market**: Vibrant sounds for bustling marketplaces

### 3. Wellness & Health
- **Spa**: Deeply relaxing music for spa treatments
- **Yoga**: Mindful music for yoga practice and meditation

### 4. Corporate & Business
- **Modern**: Contemporary professional music with traditional elements
- **Traditional**: Classic professional music emphasizing cultural heritage

### 5. Events & Celebrations
- **Wedding**: Romantic and ceremonial music for weddings
- **Festival**: Vibrant music for festivals and community celebrations

## Content Types

### Sound Logos (3 per subcategory)
- Duration: 8-12 seconds
- Purpose: Brand audio signatures
- Use cases: App sounds, notifications, brand recognition

### Playlists (2 per subcategory)
- Duration: 30 minutes each
- Purpose: Background atmosphere
- Use cases: Business ambient music, customer experience

### Social Clips (5 per subcategory)
- Duration: 15-60 seconds
- Purpose: Social media content
- Platforms: Instagram, TikTok, Facebook, YouTube

### Long-form (1 per subcategory)
- Duration: 10 minutes
- Purpose: Extended experiences
- Use cases: Events, presentations, immersive environments

## Case Studies

The library includes 3 detailed case studies showcasing real business impact:

1. **Mountain View Traditional Restaurant** - Fine dining with cultural authenticity
2. **Heritage Craft Boutique** - Artisan retail with cultural storytelling
3. **Mizoram Wellness Retreat** - Unique wellness experience with traditional healing

Each case study includes:
- Business challenge and solution
- Implementation timeline and process
- Detailed results and ROI analysis
- Customer testimonials and ratings
- Before/after comparisons
- Usage statistics and business metrics

## Metadata Structure

The `demo-metadata.json` file contains comprehensive information for each demo:

- **Basic Info**: Name, duration, description, mood
- **Cultural Context**: Instruments used, cultural significance
- **Generation Parameters**: AI settings used for creation
- **Business Application**: Use cases, target audience
- **Licensing**: Terms, attribution requirements
- **Analytics**: Play counts, engagement metrics

## Usage in Application

The demo library is integrated into the web application through:

- **Demo Showcase Page** (`/dashboard/demos`): Browse and filter all demos
- **Case Studies Page** (`/dashboard/case-studies`): Detailed success stories
- **API Endpoints**: Metadata and audio file serving
- **Demo Library Service**: Business logic and data management

## Audio File Serving

Demo audio files are served through the `/api/demo-audio/[...path]/` endpoint with:
- Proper MIME types for different formats
- Caching headers for performance
- Security checks for path traversal
- Fallback to existing demo files

## Licensing Terms

### Personal Use
- **Price**: Free
- **Usage**: Personal projects, non-commercial use
- **Attribution**: Required
- **Commercial Rights**: No

### Commercial Use
- **Price**: $49/track or $199/month unlimited
- **Usage**: Commercial projects, business use
- **Attribution**: Optional
- **Revenue Sharing**: 5% to original culture community

### Enterprise
- **Price**: Custom pricing
- **Usage**: Large scale commercial use
- **Custom Generation**: Available
- **Revenue Sharing**: Negotiable

## Cultural Considerations

All demos respect cultural heritage and include:
- Proper attribution to Mizo traditional music
- Educational context about instruments and cultural significance
- Guidelines for respectful commercial use
- Revenue sharing with cultural communities

## Technical Implementation

The demo library showcases:
- AI music generation capabilities
- Cultural preservation through technology
- Business application of traditional music
- Scalable audio content management
- User engagement and analytics tracking

This comprehensive demo library serves as both a showcase of Cultural Sound Lab's capabilities and a practical tool for businesses to understand the potential impact of AI-generated traditional music on their operations.