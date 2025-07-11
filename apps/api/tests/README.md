# Cultural Sound Lab Integration Tests

This directory contains integration tests for the Cultural Sound Lab platform.

## Prerequisites

1. Ensure you have the `.env` file configured in `/apps/api/` with the following variables:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `REDIS_URL`
   - `API_URL` (defaults to http://localhost:3001)

2. Make sure Redis is running:
   ```bash
   # Using Docker
   docker run -d -p 6379:6379 redis:alpine
   
   # Or install locally
   brew install redis
   brew services start redis
   ```

3. Install dependencies:
   ```bash
   cd apps/api
   npm install
   ```

## Running the Tests

### 1. Setup Test Data

First, seed the database with test data:

```bash
cd apps/api
npm run test:setup
```

This will:
- Clean existing test data
- Create 3 test users (admin, contributor, user)
- Add 3 Mizo audio samples
- Create sample generations and licenses

Test credentials created:
- **Admin**: admin@culturalsoundlab.com / admin123456
- **Contributor**: contributor@culturalsoundlab.com / contributor123456
- **User**: user@culturalsoundlab.com / user123456

### 2. Start the API Server

In a separate terminal, start the API server:

```bash
cd apps/api
npm run dev
```

The API should start on http://localhost:3001

### 3. Run Integration Tests

In another terminal, run the integration tests:

```bash
cd apps/api
npm run test:integration
```

Or run both setup and tests together:

```bash
cd apps/api
npm test
```

## Test Coverage

The integration tests verify:

1. **User Registration** - New user can register
2. **User Login** - Test users can authenticate
3. **API Health Check** - API server is running with database and Redis
4. **Audio Samples Loading** - Samples are retrieved correctly
5. **Generation Submission** - AI generation requests work
6. **Protected Route Access** - Authentication is enforced
7. **License Creation** - Licensing system works

## Debugging

- Check browser console for detailed logs when using the health check dashboard
- API logs will show in the terminal running `npm run dev`
- Test results include timing information for performance monitoring

## Health Check Dashboard

To view the health check dashboard in the browser:

1. Start the web app:
   ```bash
   cd apps/web
   npm run dev
   ```

2. Navigate to http://localhost:3000/health

The dashboard shows real-time status of:
- Frontend (Next.js)
- API (Express.js)
- Database (Supabase PostgreSQL)
- Storage (Supabase Storage)

## Troubleshooting

### CORS Issues
The Next.js proxy is configured to handle CORS. Make sure:
- API is running on port 3001
- Web app is running on port 3000
- `NEXT_PUBLIC_API_URL` is set correctly

### Database Connection Issues
- Verify Supabase credentials in `.env`
- Check if Supabase project is active
- Ensure Row Level Security (RLS) policies allow test operations

### Redis Connection Issues
- Ensure Redis is running on port 6379
- Check `REDIS_URL` in `.env`
- Try connecting with `redis-cli ping`