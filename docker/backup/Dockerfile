FROM alpine:3.18

# Install required packages
RUN apk add --no-cache \
    postgresql-client \
    python3 \
    py3-pip \
    curl \
    bash \
    cron \
    tar \
    gzip \
    aws-cli

# Install MinIO client
RUN curl -O https://dl.min.io/client/mc/release/linux-amd64/mc && \
    chmod +x mc && \
    mv mc /usr/local/bin/

# Install Python dependencies for MinIO operations
RUN pip3 install minio requests

# Create backup user and directories
RUN adduser -D -s /bin/bash backup
RUN mkdir -p /backups/{database,storage,logs} && \
    chown -R backup:backup /backups

# Copy backup scripts
COPY docker/backup/scripts/ /usr/local/bin/
RUN chmod +x /usr/local/bin/*.sh

# Copy crontab
COPY docker/backup/crontab /etc/crontabs/backup

# Switch to backup user
USER backup
WORKDIR /backups

# Health check
HEALTHCHECK --interval=60s --timeout=10s --start-period=5s --retries=3 \
    CMD /usr/local/bin/backup-health-check.sh

# Start cron daemon
CMD ["crond", "-f", "-l", "2"]