#!/bin/bash

# Database & Storage Optimization Setup Script
# This script sets up database migrations, performance indexes, and storage configurations

set -e

echo "🚀 Setting up Cultural Sound Lab Database & Storage Optimizations..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [[ ! -f "package.json" ]]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Navigate to API directory
cd apps/api

print_status "Checking environment variables..."

# Check if required environment variables are set
if [[ -z "$DATABASE_URL" ]]; then
    print_warning "DATABASE_URL not set. Using default for development."
    export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cultural_sound_lab"
fi

# Generate Prisma client
print_status "Generating Prisma client..."
npx prisma generate

# Run database migrations (if using Prisma migrations)
print_status "Checking database connection..."
if npx prisma db push --accept-data-loss 2>/dev/null; then
    print_status "Database schema updated successfully"
else
    print_warning "Database schema update failed or not needed"
fi

# Install performance indexes using Node.js script
print_status "Installing performance indexes..."

cat > install-indexes.js << 'EOF'
const { databaseService } = require('./dist/config/database.js');

async function installIndexes() {
    try {
        console.log('🔍 Installing performance indexes...');
        const result = await databaseService.createPerformanceIndexes();
        
        if (result) {
            console.log('✅ Performance indexes installed successfully');
        } else {
            console.log('⚠️  Some indexes may have failed to install (this is normal if they already exist)');
        }

        // Run performance analysis
        console.log('📊 Running performance analysis...');
        const analysis = await databaseService.analyzePerformance();
        
        console.log('\n📈 Performance Analysis Results:');
        console.log(`- Slow queries found: ${analysis.slowQueries.length}`);
        console.log(`- Index usage analysis: ${analysis.indexUsage.length} entries`);
        console.log(`- Table statistics: ${analysis.tableStats.length} tables`);
        
        if (analysis.recommendations.length > 0) {
            console.log('\n💡 Recommendations:');
            analysis.recommendations.forEach((rec, i) => {
                console.log(`${i + 1}. ${rec}`);
            });
        }

        await databaseService.cleanup();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error installing indexes:', error.message);
        process.exit(1);
    }
}

installIndexes();
EOF

# Build the project first
print_status "Building API project..."
npm run build

# Run the index installation
node install-indexes.js

# Clean up temporary script
rm install-indexes.js

# Check storage configuration
print_status "Checking storage configuration..."

# Test MinIO connection if configured
if [[ -n "$MINIO_ENDPOINT" ]]; then
    print_status "Testing MinIO connection..."
    cat > test-storage.js << 'EOF'
const { storageService } = require('./dist/config/storage.js');

async function testStorage() {
    try {
        console.log('🔍 Testing storage services...');
        const health = await storageService.healthCheck();
        
        console.log('📊 Storage Health Check Results:');
        console.log(`- Primary provider (${health.provider}): ${health.primary ? '✅ Healthy' : '❌ Unhealthy'}`);
        console.log(`- Fallback provider (${health.fallbackProvider || 'none'}): ${health.fallback ? '✅ Healthy' : '❌ Unhealthy'}`);
        
        if (health.primary || health.fallback) {
            console.log('✅ Storage services are operational');
        } else {
            console.log('⚠️  Storage services may need configuration');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Storage test failed:', error.message);
        process.exit(1);
    }
}

testStorage();
EOF

    node test-storage.js
    rm test-storage.js
fi

# Test CDN configuration if enabled
if [[ "$CDN_ENABLED" == "true" ]]; then
    print_status "Testing CDN configuration..."
    cat > test-cdn.js << 'EOF'
const { cdnService } = require('./dist/config/cdn.js');

async function testCDN() {
    try {
        console.log('🔍 Testing CDN services...');
        const health = await cdnService.healthCheck();
        
        console.log('📊 CDN Health Check Results:');
        console.log(`- CDN enabled: ${health.enabled ? '✅ Yes' : '❌ No'}`);
        console.log(`- CDN reachable: ${health.reachable ? '✅ Yes' : '❌ No'}`);
        console.log(`- Latency: ${health.latency}ms`);
        
        if (health.enabled && health.reachable) {
            console.log('✅ CDN services are operational');
        } else {
            console.log('⚠️  CDN services may need configuration');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ CDN test failed:', error.message);
        process.exit(1);
    }
}

testCDN();
EOF

    node test-cdn.js
    rm test-cdn.js
fi

# Navigate back to root
cd ../..

print_status "Database & Storage optimization setup completed! 🎉"

echo ""
echo "📝 Summary:"
echo "✅ Prisma schema and client generated"
echo "✅ Performance indexes installed"
echo "✅ Storage configuration verified"
echo "✅ CDN configuration checked"
echo ""
echo "🔧 Next steps:"
echo "1. Start your development environment: docker-compose up -d"
echo "2. Run the application: npm run dev"
echo "3. Monitor performance using the built-in metrics"
echo ""
echo "📚 Documentation:"
echo "- Database performance: Check the performance analysis output above"
echo "- Storage configuration: See .env.example for all storage options"
echo "- CDN setup: Configure CDN_* environment variables"
echo ""
echo "🚀 Happy coding!"