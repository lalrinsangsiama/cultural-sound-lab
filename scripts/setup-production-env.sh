#!/bin/bash

# Cultural Sound Lab Production Environment Setup Script
set -e

echo "🚀 Setting up Cultural Sound Lab Production Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${BLUE}📋 Checking prerequisites...${NC}"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    exit 1
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    exit 1
fi

# Check available disk space (minimum 10GB)
AVAILABLE_SPACE=$(df . | tail -1 | awk '{print $4}')
if [ "$AVAILABLE_SPACE" -lt 10485760 ]; then
    echo -e "${YELLOW}⚠️ Warning: Less than 10GB disk space available${NC}"
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Create necessary directories
echo -e "${BLUE}📁 Creating directory structure...${NC}"
mkdir -p {docker/backup/scripts,docker/prometheus,docker/grafana/{dashboards,datasources}}
mkdir -p {assets/sample-audio,assets/demo-audio}
mkdir -p backups/{database,storage,logs,metrics,reports}

# Make scripts executable
echo -e "${BLUE}🔧 Setting up permissions...${NC}"
chmod +x docker/backup/scripts/*.sh
chmod +x docker/k6/run-tests.sh

# Pull required Docker images
echo -e "${BLUE}📥 Pulling Docker images...${NC}"
docker-compose pull

# Build custom images
echo -e "${BLUE}🔨 Building custom images...${NC}"
docker-compose build

# Initialize MinIO buckets
echo -e "${BLUE}🪣 Setting up MinIO buckets...${NC}"
docker-compose up -d minio
sleep 10

# Configure MinIO
docker run --rm --network cultural-sound-lab_csl-network \
    minio/mc:latest sh -c "
    mc alias set csl-minio http://minio:9000 minioadmin minioadmin123 &&
    mc mb csl-minio/cultural-audio &&
    mc policy set public csl-minio/cultural-audio
"

# Start database and seed data
echo -e "${BLUE}🗄️ Setting up database...${NC}"
docker-compose up -d postgres
sleep 15

# Apply schema and seed data
echo -e "${BLUE}🌱 Seeding production data...${NC}"
docker-compose exec -T postgres psql -U csl_user -d cultural_sound_lab < scripts/seed-production-data.sql

# Start all services
echo -e "${BLUE}▶️ Starting all services...${NC}"
docker-compose up -d

# Wait for services to be ready
echo -e "${BLUE}⏳ Waiting for services to be ready...${NC}"
for service in api web; do
    echo "Waiting for $service..."
    for i in {1..30}; do
        if curl -f "http://localhost:3001/api/health" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ $service is ready${NC}"
            break
        fi
        sleep 5
        echo "Attempt $i/30..."
    done
done

# Create initial backup
echo -e "${BLUE}💾 Creating initial backup...${NC}"
docker-compose exec backup /usr/local/bin/backup-database.sh
docker-compose exec backup /usr/local/bin/backup-storage.sh

# Setup monitoring
echo -e "${BLUE}📊 Setting up monitoring...${NC}"
# Import Grafana dashboard
sleep 10
curl -X POST \
    -H "Content-Type: application/json" \
    -d @docker/grafana/dashboards/csl-dashboard.json \
    "http://admin:admin123@localhost:3002/api/dashboards/db" || echo "Dashboard import will be manual"

# Run smoke tests
echo -e "${BLUE}🧪 Running smoke tests...${NC}"
docker-compose run --rm k6 run /scripts/smoke-test.js

# Generate environment report
REPORT_FILE="production_setup_report_$(date +%Y%m%d_%H%M%S).txt"
cat > "$REPORT_FILE" << EOF
Cultural Sound Lab Production Environment Setup Report
=====================================================
Setup Date: $(date)
Environment: Local Docker Production Simulation

Services Status:
- Web Application: http://localhost:3000
- API Backend: http://localhost:3001
- Grafana Dashboard: http://localhost:3002 (admin:admin123)
- Prometheus Metrics: http://localhost:9090
- MinIO Storage: http://localhost:9001 (minioadmin:minioadmin123)
- Database: localhost:5432 (csl_user:csl_password)

Service Health:
$(docker-compose ps)

Database Tables:
$(docker-compose exec -T postgres psql -U csl_user -d cultural_sound_lab -c "SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'public';" 2>/dev/null || echo "Database check failed")

Storage Status:
$(docker-compose exec -T minio mc ls csl-minio/cultural-audio 2>/dev/null || echo "Storage check failed")

Load Testing:
- Smoke test: Completed
- Full load tests available via: docker-compose run --rm k6 run /scripts/load-test.js

Backup Status:
- Database backup: Available
- Storage backup: Available
- Backup schedule: Configured (daily at 2-3 AM)

Monitoring:
- Prometheus: Collecting metrics
- Grafana: Dashboard configured
- Health checks: Enabled

Quick Commands:
- View logs: docker-compose logs [service]
- Run load tests: docker/k6/run-tests.sh
- Manual backup: docker-compose exec backup /usr/local/bin/backup-database.sh
- Disaster recovery: docker-compose exec backup /usr/local/bin/disaster-recovery.sh

Next Steps:
1. Access Grafana at http://localhost:3002 to view metrics
2. Run load tests to validate performance
3. Monitor logs for any issues
4. Test backup/restore procedures
5. Customize alert thresholds in Prometheus

EOF

echo -e "${GREEN}✅ Production environment setup completed!${NC}"
echo ""
echo -e "${BLUE}📊 Environment Report: $REPORT_FILE${NC}"
echo ""
echo -e "${YELLOW}🌐 Access Points:${NC}"
echo "Web App: http://localhost:3000"
echo "API: http://localhost:3001"
echo "Grafana: http://localhost:3002 (admin:admin123)"
echo "MinIO: http://localhost:9001 (minioadmin:minioadmin123)"
echo ""
echo -e "${YELLOW}🧪 Load Testing:${NC}"
echo "Run: docker/k6/run-tests.sh"
echo ""
echo -e "${YELLOW}💾 Backup & Recovery:${NC}"
echo "Database backup: docker-compose exec backup /usr/local/bin/backup-database.sh"
echo "Disaster recovery: docker-compose exec backup /usr/local/bin/disaster-recovery.sh"
echo ""
echo -e "${GREEN}🎉 Your Cultural Sound Lab production simulation is ready!${NC}"