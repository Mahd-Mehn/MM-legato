# Legato Authentication Service

The authentication service handles user registration, login, session management, and role-based access control for the Legato platform.

## Features

- **User Management**: Registration and profile management for Writers, Readers, Studios, and Admins
- **Secure Authentication**: bcrypt password hashing with JWT token-based authentication
- **Session Management**: Refresh token rotation and session tracking
- **Role-Based Access Control**: Support for different user roles with appropriate permissions
- **Database Models**: SQLAlchemy models with proper relationships and validation
- **Complete API**: Full REST API with comprehensive endpoints

## Database Schema

### Users Table
- `id`: UUID primary key
- `email`: Unique email address
- `username`: Unique username
- `hashed_password`: bcrypt hashed password
- `role`: User role (WRITER, READER, STUDIO, ADMIN)
- `is_active`: Account status
- `is_verified`: Email verification status
- `created_at`, `updated_at`: Timestamps

### User Profiles Table
- `id`: UUID primary key
- `user_id`: Foreign key to users table
- `display_name`: Public display name
- `bio`: User biography
- `avatar_url`: Profile picture URL
- `language_preference`: Preferred language
- `timezone`: User timezone
- `notification_preferences`: JSON notification settings

### User Sessions Table
- `id`: UUID primary key
- `user_id`: Foreign key to users table
- `refresh_token`: JWT refresh token
- `device_info`: Device/browser information
- `ip_address`: Session IP address
- `is_active`: Session status
- `expires_at`: Session expiration
- `created_at`, `last_used_at`: Timestamps

## Setup and Installation

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Environment Variables**:
   ```bash
   DATABASE_URL=postgresql://legato_user:legato_pass@localhost:5432/legato_auth
   REDIS_URL=redis://localhost:6379/0
   JWT_SECRET_KEY=your-secret-key-here
   ACCESS_TOKEN_EXPIRE_MINUTES=15
   REFRESH_TOKEN_EXPIRE_DAYS=30
   ```

3. **Run Migrations**:
   ```bash
   python run_migrations.py
   ```

4. **Start Service**:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8001 --reload
   ```

## Testing

Run all tests:
```bash
python test_models.py
python test_jwt.py
python test_auth_dependencies.py
python test_basic_endpoints.py
```

## API Endpoints

### Health Check
- `GET /` - Service information
- `GET /health` - Health check with database and Redis status

### Authentication
- `POST /auth/register` - User registration with role selection
- `POST /auth/login` - User login with credential validation
- `POST /auth/refresh` - Token refresh with rotation
- `POST /auth/logout` - User logout (single session)
- `POST /auth/logout-all` - Logout from all sessions

### Profile Management
- `GET /auth/profile` - Get user profile
- `PUT /auth/profile` - Update user profile
- `POST /auth/change-password` - Change password

### Password Reset
- `POST /auth/reset-password` - Request password reset
- `POST /auth/reset-password/confirm` - Confirm password reset

### Session Management
- `GET /auth/sessions` - Get user's active sessions
- `DELETE /auth/sessions/{session_id}` - Revoke specific session

## API Usage Examples

### Register a new writer
```bash
curl -X POST "http://localhost:8001/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "writer@example.com",
    "username": "mywriter",
    "password": "securepass123",
    "role": "writer",
    "display_name": "My Writer Name"
  }'
```

### Login
```bash
curl -X POST "http://localhost:8001/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "writer@example.com",
    "password": "securepass123"
  }'
```

### Get profile (requires token)
```bash
curl -X GET "http://localhost:8001/auth/profile" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Security Features

- **Password Hashing**: bcrypt with automatic salt generation
- **JWT Tokens**: Secure token-based authentication with configurable expiration
- **Session Tracking**: Device and IP tracking for security monitoring
- **Token Rotation**: Refresh token rotation for enhanced security
- **Role-Based Access**: Granular permissions based on user roles
- **Password Reset**: Secure token-based password reset flow
- **Session Management**: Multi-device session tracking and revocation

## Role-Based Access Control

### User Roles
- **READER**: Can read content, comment, rate, purchase coins, subscribe
- **WRITER**: All reader permissions plus create/edit content, view analytics
- **STUDIO**: Can browse marketplace, license content, contact writers
- **ADMIN**: Full system access and administration

### Permission Hierarchy
- Admin > Studio > Writer > Reader
- Higher roles inherit lower role permissions
- Resource ownership allows access regardless of role level

## Database Indexes

The migration creates optimized indexes for:
- Email and username lookups (with active user filter)
- Session token lookups (with active session filter)
- User session queries by user_id and status
- Expired session cleanup queries

## Default Admin User

The migration creates a default admin user:
- **Email**: admin@legato.com
- **Password**: admin123
- **Role**: ADMIN

⚠️ **Important**: Change the default admin password in production!

## Error Handling

The API provides comprehensive error responses:
- **400**: Bad Request (validation errors, duplicate data)
- **401**: Unauthorized (invalid credentials, expired tokens)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found (resource not found)
- **422**: Unprocessable Entity (validation errors)
- **500**: Internal Server Error (system errors)

## Requirements Satisfied

This implementation satisfies the following requirements:

### Requirement 1.1: User Registration and Role Selection
- ✅ Registration endpoint with writer/reader role selection
- ✅ Secure account creation with validation

### Requirement 1.2: Secure Account Creation
- ✅ Encrypted password storage with bcrypt
- ✅ Email and username uniqueness validation
- ✅ Strong password requirements

### Requirement 1.3: User Authentication
- ✅ JWT token generation and validation
- ✅ Refresh token rotation mechanism
- ✅ Role-based access control implementation

### Requirement 1.4: Profile Management
- ✅ User profile creation and updates
- ✅ Role-based permissions and access control

### Requirement 1.5: Password Reset
- ✅ Secure password reset functionality
- ✅ Token-based reset confirmation

## File Structure

```
services/auth-service/
├── main.py                    # FastAPI application entry point
├── models.py                  # SQLAlchemy database models
├── database.py                # Database configuration and utilities
├── schemas.py                 # Pydantic request/response schemas
├── auth_routes.py             # Authentication API endpoints
├── jwt_utils.py               # JWT token management utilities
├── auth_dependencies.py       # Authentication dependencies and middleware
├── migrations.py              # Database migration scripts
├── run_migrations.py          # Migration runner script
├── requirements.txt           # Python dependencies
├── Dockerfile                 # Docker container configuration
├── README.md                  # This documentation
└── tests/
    ├── test_models.py         # Model unit tests
    ├── test_jwt.py            # JWT system tests
    ├── test_auth_dependencies.py  # Dependency tests
    └── test_basic_endpoints.py    # API endpoint tests
```

## Production Considerations

1. **Environment Variables**: Set secure values for JWT_SECRET_KEY and database credentials
2. **CORS Configuration**: Configure appropriate origins for production
3. **Rate Limiting**: Implement rate limiting for authentication endpoints
4. **Monitoring**: Set up logging and monitoring for security events
5. **SSL/TLS**: Use HTTPS in production
6. **Database Security**: Use connection pooling and secure database configuration
7. **Redis Security**: Secure Redis instance with authentication
8. **Admin Account**: Change default admin credentials immediately