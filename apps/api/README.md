# Cultural Sound Lab API

Express.js API server for the Cultural Sound Lab platform, providing endpoints for audio sample management, AI-powered music generation, and licensing functionality.

## Features

- **Audio Management**: Upload, browse, and manage cultural audio samples
- **AI Generation**: Create custom music using traditional cultural sounds
- **Licensing System**: Handle licensing and payment for audio usage
- **Authentication**: Supabase Auth integration with role-based access
- **File Upload**: Secure audio file handling with validation
- **Error Handling**: Comprehensive error handling and validation

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   npm start
   ```

## API Endpoints

### Audio Management
- `GET /api/audio` - List audio samples
- `GET /api/audio/:id` - Get specific audio sample
- `GET /api/audio/:id/preview` - Get audio preview URL
- `POST /api/audio` - Upload new audio sample (requires auth)
- `PUT /api/audio/:id` - Update audio sample (requires auth)
- `DELETE /api/audio/:id` - Delete audio sample (requires auth)

### AI Generation
- `POST /api/generate` - Create generation request (requires auth)
- `GET /api/generate` - List user's generations (requires auth)
- `GET /api/generate/:id` - Get specific generation (requires auth)
- `GET /api/generate/:id/download` - Download generated audio (requires auth)
- `DELETE /api/generate/:id` - Delete generation (requires auth)

### Licensing
- `POST /api/license` - Create license (requires auth)
- `GET /api/license` - List user's licenses (requires auth)
- `GET /api/license/:id` - Get specific license (requires auth)
- `GET /api/license/:id/verify` - Verify license validity (requires auth)
- `POST /api/license/:id/download` - Record download (requires auth)

## Environment Variables

See `.env.example` for all required environment variables. Key variables include:

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_KEY` - Supabase service key (keep secret!)
- `FRONTEND_URL` - Frontend application URL for CORS
- `PORT` - Server port (default: 3001)

## Authentication

The API uses Supabase Auth with JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### User Roles
- `user` - Standard user (can generate and license)
- `cultural_contributor` - Can upload audio samples
- `admin` - Full access to all resources

## File Upload

Audio files are uploaded to Supabase Storage with the following constraints:
- Maximum file size: 50MB
- Supported formats: MP3, WAV, FLAC, AAC, OGG
- Files are validated for type and content

## Error Handling

The API returns consistent error responses:

```json
{
  "error": "Error message",
  "status": 400,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/endpoint",
  "method": "POST"
}
```

## Rate Limiting

- 100 requests per 15 minutes per IP in production
- 1000 requests per 15 minutes in development

## Development

```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run dev

# Run type checking
npm run type-check

# Run linting
npm run lint

# Run tests
npm run test

# Build for production
npm run build
```

## Architecture

```
src/
├── config/          # Configuration files
├── controllers/     # Route handlers
├── middleware/      # Express middleware
├── routes/         # Route definitions
├── types/          # TypeScript type definitions
└── index.ts        # Application entry point
```

## Security

- Helmet.js for security headers
- CORS configured for frontend domain
- Rate limiting to prevent abuse
- Input validation and sanitization
- Secure file upload handling
- Environment variable validation

## Deployment

The API is designed to be deployed on platforms like:
- Railway
- Heroku
- Vercel
- DigitalOcean App Platform
- AWS/GCP/Azure

Ensure all environment variables are set in your deployment platform.