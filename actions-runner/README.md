# GitHub Actions Self-Hosted Runner

This directory contains the setup and configuration for a GitHub Actions self-hosted runner for the Cultural Sound Lab project.

## Overview

A self-hosted runner allows you to run GitHub Actions workflows on your own machine, giving you:
- **Full control** over the environment
- **Faster execution** for local workflows
- **Access to local resources** (like direct database connections)
- **Custom dependencies** and tools

## Quick Setup

### 1. Download and Extract Runner
```bash
# Run the setup script (already completed)
./setup-runner.sh
```

### 2. Configure Runner
```bash
# Interactive configuration helper
./configure-runner.sh
```

This will prompt you for:
- GitHub repository URL
- Registration token (get from GitHub)
- Runner name (optional)

### 3. Run the Runner

#### Option A: Run Interactively (for testing)
```bash
# Start the runner (runs in foreground)
./run.sh
```

#### Option B: Install as Service (recommended)
```bash
# Install and start as system service
./install-service.sh
```

## Manual Configuration

If you prefer to configure manually:

1. **Get registration token** from GitHub:
   - Go to: `https://github.com/[username]/cultural-sound-lab/settings/actions/runners`
   - Click "New self-hosted runner"
   - Copy the token from the configuration commands

2. **Configure the runner**:
   ```bash
   ./config.sh \
     --url https://github.com/[username]/cultural-sound-lab \
     --token [YOUR_TOKEN] \
     --name csl-runner-$(hostname) \
     --labels self-hosted,macOS,backup,database
   ```

3. **Start the runner**:
   ```bash
   ./run.sh
   ```

## Service Management

Once installed as a service:

### macOS (LaunchDaemon)
```bash
# Start service
sudo ./svc.sh start

# Stop service
sudo ./svc.sh stop

# Check status
sudo ./svc.sh status

# Remove service
sudo ./svc.sh uninstall

# View logs
tail -f /usr/local/var/log/actions.runner.*.log
```

### Linux (systemd)
```bash
# Start service
sudo ./svc.sh start

# Stop service
sudo ./svc.sh stop

# Check status
sudo ./svc.sh status

# Remove service
sudo ./svc.sh uninstall

# View logs
sudo journalctl -u actions.runner.* -f
```

## Using with Backup Workflows

The backup workflow is configured to support self-hosted runners. You can choose the runner type when triggering manually:

1. Go to **Actions** → **Database Backup**
2. Click **Run workflow**
3. Set `runner_type` to:
   - `self-hosted` - Use any self-hosted runner
   - `[self-hosted, macOS]` - Use macOS self-hosted runners specifically
   - `[self-hosted, backup]` - Use runners with 'backup' label

## Runner Labels

This runner is configured with these labels:
- `self-hosted` - Indicates it's a self-hosted runner
- `macOS` or `Linux` - Operating system
- `backup` - Custom label for backup workflows
- `database` - Custom label for database operations

## Prerequisites

### macOS
- Homebrew (for installing dependencies)
- PostgreSQL client tools (auto-installed by workflow)

### Linux
- apt package manager (Ubuntu/Debian)
- PostgreSQL client tools (auto-installed by workflow)

## Security Considerations

1. **Runner Security**:
   - Runs with your user permissions
   - Has access to your local environment
   - Can execute arbitrary code from workflows

2. **Network Access**:
   - Needs internet access to communicate with GitHub
   - Can access your local network and databases

3. **Secrets**:
   - Repository secrets are available to the runner
   - Environment variables from your system are accessible

## Troubleshooting

### Common Issues

1. **Runner not appearing in GitHub**:
   - Check if configuration was successful
   - Verify the registration token is valid
   - Ensure the runner service is running

2. **Permission denied errors**:
   - Make sure scripts are executable: `chmod +x *.sh`
   - Check if sudo is required for service operations

3. **Network connectivity issues**:
   - Verify internet connection
   - Check firewall settings
   - Ensure access to api.github.com

4. **PostgreSQL client not found**:
   - The workflow will auto-install pg_dump
   - For manual runs: `brew install postgresql` (macOS) or `apt install postgresql-client` (Linux)

### Log Locations

- **Interactive mode**: Output to terminal
- **macOS service**: `/usr/local/var/log/actions.runner.*.log`
- **Linux service**: `journalctl -u actions.runner.*`

### Runner Status

Check runner status in GitHub:
```
https://github.com/[username]/cultural-sound-lab/settings/actions/runners
```

## Advanced Configuration

### Custom Labels
Add custom labels during configuration:
```bash
./config.sh --labels self-hosted,macOS,backup,database,custom-label
```

### Environment Variables
Set environment variables for the runner by editing the service file or using a `.env` file in the runner directory.

### Resource Limits
For production use, consider setting resource limits in the service configuration.

## Maintenance

### Updates
GitHub Actions runner updates automatically, but you can force an update:
```bash
./config.sh --replace
```

### Cleanup
Remove old workflow runs and artifacts:
```bash
# This is handled automatically by the cleanup job in the backup workflow
```

### Monitoring
Monitor runner health:
- Check GitHub runner status page
- Monitor system resources
- Review runner logs regularly

## Support

For issues:
1. Check the troubleshooting section above
2. Review GitHub Actions documentation
3. Check runner logs
4. Create an issue in the repository

## References

- [GitHub Actions Self-Hosted Runners](https://docs.github.com/en/actions/hosting-your-own-runners)
- [Configuring Self-Hosted Runners](https://docs.github.com/en/actions/hosting-your-own-runners/configuring-self-hosted-runners)
- [Using Self-Hosted Runners in a Workflow](https://docs.github.com/en/actions/hosting-your-own-runners/using-self-hosted-runners-in-a-workflow)