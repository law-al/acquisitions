# Docker Setup Guide

This guide explains how to run the Acquisitions API using Docker in both development and production environments.

## Architecture

The application supports two deployment modes:

1. **Development**: Uses local Postgres database (Neon Local equivalent) via Docker Compose
2. **Production**: Connects to Neon Cloud database via HTTP

## Development Setup

### Prerequisites

- Docker Desktop installed and running
- Docker Compose v3.8+

### Quick Start

1. **Configure environment variables**:

   The `.env.development` file is already created with default values.
   Edit it to match your local setup:

   ```bash
   # Edit .env.development with your local values
   # See .env.development for detailed documentation on each variable
   ```

2. **Start the development environment**:

   ```bash
   npm run docker:dev:build
   # Or manually:
   docker-compose -f docker-compose.dev.yml up --build
   ```

3. **Run database migrations**:

   ```bash
   # Inside the container
   docker exec -it acquisitions-app-dev npm run db:migrate

   # Or from host (if you have node_modules locally)
   npm run db:migrate
   ```

4. **Access the application**:
   - API: http://localhost:5000
   - Health: http://localhost:5000/api/health
   - Database: localhost:5432 (from host) or `neon-local:5432` (from container)

### Development Environment Details

The `docker-compose.dev.yml` includes:

- **neon-local**: Postgres 16 container (Neon Local equivalent)
  - Port: 5432 (configurable via `POSTGRES_PORT`)
  - User: `neon` (configurable via `POSTGRES_USER`)
  - Password: `password` (configurable via `POSTGRES_PASSWORD`)
  - Database: `neondb` (configurable via `POSTGRES_DB`)
  - Data persisted in Docker volume: `neon-local-data`

- **app**: Application container
  - Hot-reload enabled (volume mount for `src/`)
  - Auto-connects to `neon-local` database
  - Port: 5000 (configurable via `APP_PORT`)

### Environment Variables for Development

The `.env.development` file contains all development environment variables with detailed documentation.

**Key variables** (see `.env.development` for full list):

- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT` - Database settings
- `DATABASE_URL` - Auto-configured for Docker Compose
- `APP_PORT` - Application port (default: 5000)
- `CORS_ORIGIN` - CORS allowed origins (default: `*` for development)
- `JWT_SECRET` - JWT signing secret (change in production!)
- `LOG_LEVEL` - Logging level (default: `debug`)

**Note**: The `docker-compose.dev.yml` automatically loads variables from `.env.development` via `env_file`.

### Useful Development Commands

```bash
# Start services
npm run docker:dev

# Start with rebuild
npm run docker:dev:build

# View logs
docker-compose -f docker-compose.dev.yml logs -f app
docker-compose -f docker-compose.dev.yml logs -f neon-local

# Stop services
npm run docker:dev:down

# Stop and remove volumes (clears database)
docker-compose -f docker-compose.dev.yml down -v

# Execute commands in container
docker exec -it acquisitions-app-dev sh
docker exec -it acquisitions-app-dev npm run db:migrate
docker exec -it acquisitions-app-dev npm run db:studio
```

## Production Setup

### Prerequisites

- Neon Cloud database URL
- Production environment variables
- Docker and Docker Compose

### Deployment Steps

1. **Set up production environment variables**:

   ```bash
   # Option 1: Use .env.production file (DO NOT COMMIT)
   # The .env.production file is already created with template values
   # Edit .env.production with your production values
   # See .env.production for detailed documentation and security checklist

   # Option 2: Use environment variables directly
   export DATABASE_URL="postgresql://user:pass@ep-xxx.region.aws.neon.tech/db?sslmode=require"
   export JWT_SECRET="your-production-secret"
   export CORS_ORIGIN="https://yourdomain.com"
   ```

2. **Build and start**:

   ```bash
   npm run docker:prod:build
   # Or manually:
   docker-compose -f docker-compose.prod.yml up --build -d
   ```

3. **Run migrations** (if needed):

   ```bash
   docker exec -it acquisitions-app-prod npm run db:migrate
   ```

4. **Verify deployment**:
   ```bash
   curl http://localhost:5000/api/health
   ```

### Production Environment Details

The `docker-compose.prod.yml` includes:

- **app**: Production application container
  - No volume mounts (immutable container)
  - Restart policy: `unless-stopped`
  - Health checks enabled
  - Connects to Neon Cloud via HTTP

### Production Environment Variables

**Required variables** (see `.env.production` for full list with documentation):

- `DATABASE_URL` - Neon Cloud connection string (get from [Neon Console](https://console.neon.tech))
- `JWT_SECRET` - Strong random secret (generate with `openssl rand -base64 32`)
- `CORS_ORIGIN` - Production domain(s)
- `ARCJET_KEY` - Production Arcjet API key
- `LOG_LEVEL` - Set to `info` for production

**Note**: The `docker-compose.prod.yml` automatically loads variables from `.env.production` via `env_file`.
You can also override these via CI/CD environment variables.

### Useful Production Commands

```bash
# Start production
npm run docker:prod:build

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop production
npm run docker:prod:down

# Restart production
docker-compose -f docker-compose.prod.yml restart

# View container status
docker-compose -f docker-compose.prod.yml ps
```

## Database Connection Modes

The application automatically detects the connection type:

### Local Postgres (Development)

- **Connection String**: `postgresql://user:password@localhost:5432/dbname`
- **Protocol**: TCP (standard Postgres)
- **Driver**: `postgres` (postgres-js)
- **Use Case**: Development, testing, Neon Local

### Neon Cloud (Production)

- **Connection String**: `postgresql://user:pass@ep-xxx.region.aws.neon.tech/db?sslmode=require`
- **Protocol**: HTTP (Neon serverless)
- **Driver**: `@neondatabase/serverless`
- **Use Case**: Production deployments

The application detects Neon Cloud URLs by checking for `neon.tech` in the connection string.

## Troubleshooting

### Database Connection Issues

**Problem**: Cannot connect to database

**Solutions**:

- Check `DATABASE_URL` is set correctly
- Verify database is running: `docker-compose ps`
- Check database logs: `docker-compose logs neon-local`
- Test connection: `docker exec -it acquisitions-app-dev node -e "console.log(process.env.DATABASE_URL)"`

### Port Conflicts

**Problem**: Port 5000 or 5432 already in use

**Solutions**:

- Change ports in `docker-compose.yml`:
  ```yaml
  ports:
    - '5001:5000' # Use 5001 on host
  ```
- Or stop conflicting service:
  ```bash
  lsof -ti:5000 | xargs kill
  ```

### Migration Issues

**Problem**: Migrations fail

**Solutions**:

- Ensure database is accessible
- Check `DATABASE_URL` format
- Run migrations manually:
  ```bash
  docker exec -it acquisitions-app-dev npm run db:migrate
  ```

### Container Won't Start

**Problem**: Container exits immediately

**Solutions**:

- Check logs: `docker-compose logs app`
- Verify environment variables are set
- Check Dockerfile syntax
- Ensure `src/index.js` exists and is valid

## Best Practices

1. **Never commit `.env.production`** - Use secrets management
2. **Use health checks** - Monitor container health
3. **Persist database data** - Use Docker volumes for local dev
4. **Separate dev/prod configs** - Use different compose files
5. **Version control** - Tag Docker images for production
6. **Backup database** - Regular backups for production data

## CI/CD Integration

Example GitHub Actions workflow:

```yaml
name: Deploy Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to production
        run: |
          docker-compose -f docker-compose.prod.yml up --build -d
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          JWT_SECRET: ${{ secrets.JWT_SECRET }}
```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Neon Database Documentation](https://neon.tech/docs)
- [Neon Local Documentation](https://neon.com/docs/local/neon-local)
