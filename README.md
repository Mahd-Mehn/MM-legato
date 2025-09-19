# Legato Platform

A social reading and writing platform that enables readers to discover, read, and interact with books and chapters while providing writers with tools to publish, monetize, and build communities around their stories.

## Tech Stack

### Frontend
- Next.js 14 (App Router) with TypeScript
- ShadCN UI + Tailwind CSS
- React Query (TanStack Query) for data fetching
- NextAuth.js for authentication
- React Hook Form + Zod for forms

### Backend
- Python 3.11+ with FastAPI
- SQLAlchemy ORM with Alembic migrations
- SQLite (development) / PostgreSQL (production)
- Redis for caching and sessions
- JWT for authentication

### External Services
- Stripe for payment processing
- Cloudinary for media storage
- ElevenLabs for AI audio generation

## Project Structure

```
legato/
├── frontend/          # Next.js frontend application
├── backend/           # FastAPI backend application
├── package.json       # Root package.json for development scripts
└── README.md         # This file
```

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+
- Git

### Quick Start

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd legato
   npm run install:all
   ```

2. **Set up environment variables:**
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   # Edit backend/.env with your configuration
   
   # Frontend
   cp frontend/.env.local.example frontend/.env.local
   # Edit frontend/.env.local with your configuration
   ```

3. **Initialize the database:**
   ```bash
   cd backend
   # Activate virtual environment
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   
   # Run initial migration
   alembic upgrade head
   ```

4. **Start development servers:**
   ```bash
   # From root directory
   npm run dev
   ```

   This will start:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Individual Services

**Frontend only:**
```bash
npm run dev:frontend
```

**Backend only:**
```bash
npm run dev:backend
```

## API Endpoints

### Health Check
- `GET /health` - API health check
- `GET /api/v1/health` - API v1 health check

### Authentication (Planned)
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login

### Users (Planned)
- `GET /api/v1/users/profile` - Get user profile
- `PUT /api/v1/users/profile` - Update user profile

### Books (Planned)
- `GET /api/v1/books` - List books with filters
- `POST /api/v1/books` - Create new book
- `GET /api/v1/books/{id}` - Get book details

## Development

### Adding New Dependencies

**Frontend:**
```bash
cd frontend
npm install <package-name>
```

**Backend:**
```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install <package-name>
pip freeze > requirements.txt
```

### Database Migrations

**Create new migration:**
```bash
cd backend
alembic revision --autogenerate -m "Description of changes"
```

**Apply migrations:**
```bash
alembic upgrade head
```

### Code Quality

The project uses:
- ESLint and TypeScript for frontend code quality
- Python type hints and proper imports for backend
- Consistent code formatting

## Environment Variables

### Backend (.env)
```
DATABASE_URL=sqlite:///./legato.db
REDIS_URL=redis://localhost:6379
SECRET_KEY=your-secret-key
ALLOWED_HOSTS=["http://localhost:3000"]
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
```

## Contributing

1. Create a feature branch from main
2. Make your changes
3. Test your changes locally
4. Submit a pull request

## License

[Add your license information here]