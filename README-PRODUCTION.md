# Cultural Sound Lab - Production Environment

Complete local production simulation setup for Cultural Sound Lab with monitoring, load testing, and backup/recovery.

## Quick Start

```bash
# Setup entire production environment
./scripts/setup-production-env.sh

# Or step by step:
docker-compose up -d
./docker/k6/run-tests.sh
```

## Services

| Service | URL | Credentials |
|---------|-----|-------------|
| Web App | http://localhost:3000 | - |
| API | http://localhost:3001 | - |
| Grafana | http://localhost:3002 | admin:admin123 |
| Prometheus | http://localhost:9090 | - |
| MinIO | http://localhost:9001 | minioadmin:minioadmin123 |
| PostgreSQL | localhost:5432 | csl_user:csl_password |

## Load Testing

### Run Full Test Suite
```bash
./docker/k6/run-tests.sh
```

### Individual Tests
```bash
# Smoke test (30s, 1 user)
docker-compose run --rm k6 run /scripts/smoke-test.js

# Production load (5m, 100 users)
docker-compose run --rm k6 run --vus 100 --duration 5m /scripts/load-test.js

# Spike test
docker-compose run --rm k6 run --stage 30s:50,1m:200,30s:0 /scripts/load-test.js
```

### Test Results
- Response time: < 500ms (95th percentile)
- Error rate: < 5%
- Throughput: > 100 RPS
- Memory usage: Monitored via Grafana

## Monitoring

### Grafana Dashboard
- **URL**: http://localhost:3002
- **Login**: admin / admin123
- **Dashboards**: Cultural Sound Lab Production Dashboard

### Key Metrics
- Service health status
- Request rate and response times
- Error rates
- CPU/Memory usage
- Database connections
- Generation queue size

### Prometheus Metrics
- **URL**: http://localhost:9090
- Raw metrics endpoint: http://localhost:3001/metrics

## Backup & Recovery

### Automated Backups
- **Database**: Daily at 2 AM
- **Storage**: Daily at 3 AM
- **Retention**: 30 days
- **Location**: `/backups/` directory

### Manual Backup
```bash
# Database backup
docker-compose exec backup /usr/local/bin/backup-database.sh

# Storage backup
docker-compose exec backup /usr/local/bin/backup-storage.sh
```

### Disaster Recovery
```bash
# Full system restore
docker-compose exec backup /usr/local/bin/disaster-recovery.sh full local latest

# Database only
docker-compose exec backup /usr/local/bin/disaster-recovery.sh database-only local latest

# Storage only
docker-compose exec backup /usr/local/bin/disaster-recovery.sh storage-only local latest
```

### Restore Individual Components
```bash
# List available backups
docker-compose exec backup ls -la /backups/database/
docker-compose exec backup ls -la /backups/storage/

# Restore specific backup
docker-compose exec backup /usr/local/bin/restore-database.sh csl_database_backup_20240112_020000.sql.gz
```

## Production Data

### Seeded Data (50+ samples, 100+ generations)
- **Users**: 12 test users with different subscription tiers
- **Audio Samples**: 50+ cultural instruments from 8+ cultures
- **Generations**: 100+ AI-generated tracks
- **Licenses**: Various license types and revenue splits
- **Analytics**: Realistic usage tracking data

### Test Users
```
john.doe@example.com (Pro user, Mizo culture)
sarah.chen@example.com (Enterprise user, Chinese culture)
miguel.rodriguez@example.com (Free user, Mexican culture)
priya.patel@example.com (Pro user, Indian culture)
admin@culturalsoundlab.com (Admin user)
```
Password for all: `password123`

## Performance Benchmarks

### Target Metrics
- **Concurrent Users**: 100+ simultaneous users
- **Response Time**: 95th percentile < 500ms
- **Error Rate**: < 5%
- **Memory Usage**: < 85% of available RAM
- **CPU Usage**: < 80% under load
- **Database Connections**: Within pool limits

### Load Test Scenarios
1. **Production Load**: 100 users for 10 minutes
2. **Spike Test**: Burst to 200 users
3. **Stress Test**: Gradual increase to 400 users
4. **Memory Test**: Memory leak detection
5. **Database Stress**: Concurrent DB operations

## Troubleshooting

### Check Service Health
```bash
docker-compose ps
docker-compose logs [service-name]
curl http://localhost:3001/api/health
```

### View Metrics
```bash
# Prometheus metrics
curl http://localhost:3001/metrics

# Database performance
docker-compose exec postgres psql -U csl_user -d cultural_sound_lab -c "SELECT * FROM performance_summary;"
```

### Common Issues

**Services not starting:**
- Check Docker is running
- Verify port availability (3000, 3001, 3002, 5432, 6379, 9000)
- Check disk space

**Load tests failing:**
- Ensure all services are healthy
- Check Grafana for resource usage
- Verify test data is seeded

**Backup failures:**
- Check backup directory permissions
- Verify disk space
- Review backup logs in `/backups/logs/`

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │    │   Monitoring    │    │     Backup      │
│                 │    │                 │    │                 │
│      nginx      │    │   Prometheus    │    │   Automated     │
│    (future)     │    │    Grafana      │    │   Scheduled     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│                 │    │                 │    │                 │
│    Next.js      │    │   Express.js    │    │  PostgreSQL     │
│     :3000       │    │     :3001       │    │     :5432       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐    ┌─────────────────┐
                    │     Cache       │    │    Storage      │
                    │                 │    │                 │
                    │     Redis       │    │     MinIO       │
                    │     :6379       │    │     :9000       │
                    └─────────────────┘    └─────────────────┘
```

## Production Readiness Checklist

- [x] Multi-service Docker environment
- [x] Production-like data (50+ samples, 100+ generations)
- [x] Load testing (100+ concurrent users)
- [x] Performance monitoring (Grafana + Prometheus)
- [x] Automated backups (daily database + storage)
- [x] Disaster recovery procedures
- [x] Health checks and metrics
- [x] Error tracking and logging
- [x] Security configurations
- [x] Resource optimization

## Next Steps

1. **Scale Testing**: Test with more concurrent users
2. **Security Hardening**: Add SSL, secrets management
3. **CI/CD Pipeline**: Automated deployments
4. **Geographic Distribution**: Multi-region setup
5. **Advanced Monitoring**: APM, distributed tracing