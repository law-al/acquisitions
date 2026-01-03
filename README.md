# Acquisitions API

Express.js application with authentication, security middleware, and Neon Database integration.

## Features

- 🔐 JWT-based authentication (signup, signin, signout)
- 🛡️ Security middleware with Arcjet (rate limiting, bot detection, shield protection)
- 🗄️ Neon Database integration (local development + cloud production)
- 📝 Winston logging
- 🐳 Dockerized for easy deployment
- ✅ Input validation with Zod
- 🔒 Role-based access control

## Prerequisites

- Node.js 20+
- Docker and Docker Compose
- Neon account (for production database)

## Quick Start

### Development with Docker (Recommended)

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd acquisitions
   ```

2. **Set up environment variables**

   The `.env.development` file is already created with default values.
   Edit it to match your local setup:

   ```bash
   # Edit .env.development with your local values
   # See .env.development for all available configuration options
   ```

   **Note**: The `.env.development` file is gitignored and contains default development settings.
   See the file comments for detailed documentation on each variable.

3. **Start the development environment**

   ```bash
   docker-compose -f docker-compose.dev.yml up --build
   ```

   This will:
   - Start a local Postgres database (Neon Local equivalent)
   - Start your application with hot-reload
   - Automatically connect the app to the local database

4. **Run database migrations**

   ```bash
   # Inside the app container or locally
   npm run db:migrate
   ```

5. **Access the application**
   - API: http://localhost:5000
   - Health check: http://localhost:5000/api/health

### Development without Docker

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Set up local Postgres database**
   - Install Postgres locally or use Neon Local
   - Create a database

3. **Configure environment**

   ```bash
   cp .env.development.example .env
   # Update DATABASE_URL to point to your local Postgres
   # Example: DATABASE_URL=postgresql://user:password@localhost:5432/neondb
   ```

4. **Run migrations**

   ```bash
   npm run db:migrate
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

## Database Configuration

### Development (Local)

The application automatically detects local Postgres connections and uses TCP connections for better performance:

- **Docker**: Automatically configured via `docker-compose.dev.yml`
- **Local**: Use standard `postgresql://` connection string
- Connection string format: `postgresql://user:password@localhost:5432/dbname`

### Production (Neon Cloud)

The application uses Neon's serverless HTTP connection for production:

- Get your connection string from [Neon Console](https://console.neon.tech)
- Format: `postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require`
- The app automatically detects Neon Cloud URLs and uses HTTP connections

## Docker Deployment

### Development

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up

# Start in detached mode
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f app

# Stop services
docker-compose -f docker-compose.dev.yml down

# Stop and remove volumes
docker-compose -f docker-compose.dev.yml down -v
```

### Production

1. **Set up production environment variables**

   ```bash
   # The .env.production file is already created with template values
   # Edit .env.production with your production values
   # IMPORTANT: Never commit .env.production to version control
   # See .env.production for all required configuration options
   ```

   **Critical**: Update these values in `.env.production`:
   - `DATABASE_URL`: Your Neon Cloud connection string
   - `JWT_SECRET`: Generate a strong random secret (use `openssl rand -base64 32`)
   - `CORS_ORIGIN`: Your production domain(s)
   - `ARCJET_KEY`: Your production Arcjet API key

2. **Build and run**

   ```bash
   docker-compose -f docker-compose.prod.yml up --build -d
   ```

3. **Or use environment variables directly**
   ```bash
   DATABASE_URL=your-neon-cloud-url \
   JWT_SECRET=your-secret \
   docker-compose -f docker-compose.prod.yml up --build -d
   ```

## Environment Variables

Environment variables are configured in:

- **Development**: `.env.development` (see file for detailed documentation)
- **Production**: `.env.production` (see file for detailed documentation)

Both files contain comprehensive comments explaining each variable and where it's used in the codebase.

### Required Variables

- `DATABASE_URL` - Database connection string
  - Development: `postgresql://neon:password@neon-local:5432/neondb` (Docker) or `localhost:5432` (local)
  - Production: Neon Cloud connection string from [Neon Console](https://console.neon.tech)
  - See: `src/config/database.js` for connection type auto-detection

- `JWT_SECRET` - Secret key for JWT tokens
  - Development: Default value provided in `.env.development`
  - Production: **MUST** be changed to a strong random secret (use `openssl rand -base64 32`)
  - See: `src/utils/jwt.js`

- `PORT` - Server port (default: 5000)
  - See: `src/server.js`

### Optional Variables

- `NODE_ENV` - Environment (development/production)
  - Automatically set by Docker Compose files

- `CORS_ORIGIN` - Allowed CORS origin
  - Development: `*` (allows all origins)
  - Production: Specific domain(s) required
  - See: `src/app.js`

- `JWT_EXPIRATION` - JWT token expiration (default: 1d)
  - See: `src/utils/jwt.js`

- `ARCJET_KEY` - Arcjet API key for security features
  - Get from: https://app.arcjet.com
  - See: `src/config/arcjet.js`, `src/middlewares/security.middleware.js`

- `LOG_LEVEL` - Logging level (debug/info/warn/error)
  - Development: `debug` recommended
  - Production: `info` recommended
  - See: `src/config/logger.js`

### Database Connection Variables (Development Docker)

Used by `docker-compose.dev.yml`:

- `POSTGRES_USER` - Postgres username (default: `neon`)
- `POSTGRES_PASSWORD` - Postgres password (default: `password`)
- `POSTGRES_DB` - Database name (default: `neondb`)
- `POSTGRES_PORT` - Postgres port (default: `5432`)

**For detailed documentation on each variable, see the comments in `.env.development` and `.env.production` files.**

## API Endpoints

### Authentication

- `POST /api/auth/signup` - Register a new user
- `POST /api/auth/signin` - Login user
- `POST /api/auth/signout` - Logout user

### Health & Info

- `GET /api/health` - Health check endpoint
- `GET /api` - API status
- `GET /` - Root endpoint

## Database Migrations

```bash
# Generate migration
npm run db:generate

# Run migrations
npm run db:migrate

# Open Drizzle Studio
npm run db:studio
```

## Project Structure

```
src/
├── config/          # Configuration files (database, logger, arcjet)
├── controllers/     # Request handlers
├── middlewares/     # Express middlewares
├── models/          # Database models (Drizzle ORM)
├── routes/          # API routes
├── services/        # Business logic
├── utils/           # Utility functions
├── validations/     # Zod validation schemas
├── app.js           # Express app setup
├── index.js         # Application entry point
└── server.js        # Server configuration
```

## Security Features

- **Rate Limiting**: Role-based rate limits (admin: 20/min, user: 10/min, guest: 5/min)
- **Bot Detection**: Automatic bot detection and blocking
- **Shield Protection**: WAF protection against common attacks
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Zod schema validation for all inputs
- **Security Headers**: Helmet.js for security headers

## Troubleshooting

### Database Connection Issues

- **Development**: Ensure Postgres is running and `DATABASE_URL` is correct
- **Production**: Verify Neon Cloud connection string and network access
- Check logs: `docker-compose logs app` or `npm run dev` output

### Port Already in Use

- Change `PORT` in `.env` or `docker-compose.yml`
- Or stop the process using the port: `lsof -ti:5000 | xargs kill`

### Migration Issues

- Ensure database is accessible
- Check `DATABASE_URL` is correct
- Run migrations: `npm run db:migrate`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting: `npm run lint`
5. Submit a pull request

## License

ISC
