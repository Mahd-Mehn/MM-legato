# Project Structure

## Current Organization
```
/
├── .kiro/                 # Kiro configuration and steering rules
│   └── steering/          # AI assistant guidance documents
├── plans/                 # Product planning and documentation
│   └── product.md         # Comprehensive business plan
```

## Anticipated Structure
*As development progresses, expect the following organization:*

### Core Application
```
/src/                      # Source code
├── backend/               # Server-side application
│   ├── api/              # REST API endpoints
│   ├── models/           # Data models (users, stories, payments)
│   ├── services/         # Business logic (IP protection, payments)
│   └── integrations/     # External API integrations
├── frontend/             # Client-side application
│   ├── components/       # Reusable UI components
│   ├── pages/           # Application pages/views
│   ├── services/        # API client and utilities
│   └── assets/          # Static assets (images, styles)
└── shared/              # Shared utilities and types
```

### Supporting Directories
```
/docs/                    # Technical documentation
/tests/                   # Test suites
/scripts/                 # Build and deployment scripts
/config/                  # Configuration files
/migrations/              # Database migrations
```

## Naming Conventions
- Use kebab-case for directories and files
- Use PascalCase for component names
- Use camelCase for variables and functions
- Use UPPER_SNAKE_CASE for constants and environment variables

## Key Principles
- **Mobile-First**: Structure should prioritize mobile user experience
- **Modular Design**: Separate concerns for stories, users, payments, and IP management
- **Scalability**: Organize for horizontal scaling and microservices if needed
- **Security**: Isolate sensitive operations (payments, IP protection)
- **Internationalization**: Structure to support multiple languages from the start

## File Organization Guidelines
- Group related functionality together
- Keep configuration files at appropriate levels
- Separate business logic from presentation logic
- Maintain clear separation between client and server code
- Use consistent folder structures across similar modules




Backend in FastAPI