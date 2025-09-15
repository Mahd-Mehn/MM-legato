# Legato IP Protection Service

The IP Protection Service provides cryptographic content protection, timestamp authority integration, and Certificate of Authorship generation for the Legato platform.

## Features

### ✅ Implemented (Task 5.1 - Cryptographic Content Protection)

- **SHA-256 Content Fingerprinting**: Generates cryptographic hashes for content protection
- **Timestamp Authority Integration**: Provides proof of creation time using internal and external TSAs
- **Certificate of Authorship Generation**: Creates verifiable digital certificates for content creators
- **Content Hash Verification**: Validates content integrity against stored hashes
- **Digital Signatures**: Platform-signed certificates for authenticity verification

### ✅ Implemented (Task 5.2 - Blockchain Integration)

- **Optional Blockchain Registration**: Register high-value content on Ethereum, Polygon, or other networks
- **Smart Contract Integration**: Mock smart contract interactions for IP verification
- **Transaction Tracking**: Monitor blockchain transaction status and confirmations
- **Forensic Proof Tools**: Generate cryptographic evidence for plagiarism detection
- **Multi-Network Support**: Support for multiple blockchain networks with configurable settings

### ✅ Implemented (Task 5.3 - Licensing & Rights Management)

- **Licensing Agreement Creation**: Generate comprehensive licensing agreements with customizable terms
- **Contract Templates**: Pre-built templates for common licensing scenarios
- **Revenue Sharing Calculation**: Automated revenue distribution between licensors, licensees, and platform
- **Rights Management**: Clear tracking of granted rights and permissions
- **Licensing Marketplace**: Platform for discovering and negotiating licensing opportunities
- **Terms Validation**: Comprehensive validation of licensing terms and conditions

## API Endpoints

### Content Registration
```
POST /api/ip/protection/register
```
Register content with cryptographic protection.

**Request:**
```json
{
  "content_id": "story_123_chapter_1",
  "content": "Chapter content here...",
  "content_type": "chapter",
  "author_id": "author_456",
  "title": "Chapter 1: The Beginning",
  "metadata": {
    "genre": "fiction",
    "language": "en"
  }
}
```

**Response:**
```json
{
  "registration_id": "reg_uuid",
  "content_hash": "sha256_hash",
  "timestamp": "2025-01-11T10:00:00Z",
  "timestamp_authority": "legato-internal",
  "verification_url": "/api/ip/verify/reg_uuid",
  "status": "registered"
}
```

### Certificate Generation
```
POST /api/ip/protection/certificate
```
Generate a Certificate of Authorship for registered content.

**Request:**
```json
{
  "registration_id": "reg_uuid",
  "author_name": "John Doe",
  "regenerate": false
}
```

**Response:**
```json
{
  "certificate_id": "cert_uuid",
  "certificate_number": "LEGATO-20250111100000-ABC123",
  "certificate_url": "/api/ip/certificate/LEGATO-20250111100000-ABC123/download",
  "verification_url": "/api/ip/verify/certificate/LEGATO-20250111100000-ABC123",
  "issued_at": "2025-01-11T10:00:00Z",
  "status": "active"
}
```

### Hash Verification
```
POST /api/ip/protection/verify-hash
```
Verify content against its expected hash.

**Request:**
```json
{
  "content": "Content to verify...",
  "expected_hash": "sha256_hash",
  "metadata": {
    "genre": "fiction"
  }
}
```

### Registration Verification
```
GET /api/ip/verify/{registration_id}
```
Verify an IP registration by ID.

### Certificate Retrieval
```
GET /api/ip/certificate/{certificate_number}?format=json|html
```
Retrieve a certificate in JSON or HTML format.

## Architecture

### Cryptographic Protection Service
- **Content Hashing**: SHA-256 with metadata inclusion
- **Digital Signatures**: RSA-2048 with PSS padding
- **Key Management**: Platform key generation and storage

### Timestamp Authority Service
- **External TSA Integration**: RFC 3161 timestamp requests
- **Fallback TSAs**: Multiple timestamp authorities for reliability
- **Internal Timestamps**: Signed internal timestamps when external TSAs fail

### Certificate Service
- **Certificate Generation**: Structured digital certificates
- **HTML Rendering**: Human-readable certificate display
- **QR Code Integration**: Verification QR codes (when available)

## Database Schema

### IP Registrations
```sql
CREATE TABLE ip_registrations (
    id VARCHAR PRIMARY KEY,
    content_id VARCHAR NOT NULL,
    content_hash VARCHAR(64) UNIQUE NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    author_id VARCHAR NOT NULL,
    title VARCHAR(500) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    timestamp_authority VARCHAR(100),
    timestamp_token TEXT,
    certificate_id VARCHAR,
    certificate_url VARCHAR(500),
    is_verified BOOLEAN DEFAULT TRUE,
    verification_method VARCHAR(50) DEFAULT 'sha256_timestamp',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Authorship Certificates
```sql
CREATE TABLE authorship_certificates (
    id VARCHAR PRIMARY KEY,
    registration_id VARCHAR REFERENCES ip_registrations(id),
    certificate_number VARCHAR(50) UNIQUE NOT NULL,
    issued_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP,
    certificate_data TEXT NOT NULL,
    digital_signature TEXT NOT NULL,
    pdf_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Content Hashes
```sql
CREATE TABLE content_hashes (
    id VARCHAR PRIMARY KEY,
    registration_id VARCHAR REFERENCES ip_registrations(id),
    hash_algorithm VARCHAR(20) DEFAULT 'sha256',
    content_hash VARCHAR(64) NOT NULL,
    content_length INTEGER NOT NULL,
    verification_attempts INTEGER DEFAULT 0,
    last_verified_at TIMESTAMP,
    verification_status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);
```

## Security Features

1. **Cryptographic Integrity**: SHA-256 hashing ensures content tampering detection
2. **Digital Signatures**: RSA signatures prevent certificate forgery
3. **Timestamp Proofs**: Timestamp authorities provide creation time verification
4. **Key Management**: Secure platform key generation and storage
5. **Input Validation**: Comprehensive request validation and sanitization

## Testing

Run the test suite:
```bash
python test_crypto.py
```

Tests cover:
- Content hashing and verification
- Digital signature creation and verification
- Timestamp authority integration
- Certificate generation and validation

## Configuration

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `TSA_URL`: Primary timestamp authority URL
- `PLATFORM_PRIVATE_KEY_PATH`: Path to platform private key
- `PLATFORM_URL`: Base URL for verification links

### Dependencies
```
fastapi==0.104.1
uvicorn==0.24.0
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
redis==5.0.1
cryptography==41.0.7
requests==2.31.0
jinja2==3.1.2
qrcode[pil]==7.4.2
```

## Usage Examples

### Register Content
```python
import requests

response = requests.post("http://localhost:8004/api/ip/protection/register", json={
    "content_id": "story_123_chapter_1",
    "content": "Once upon a time...",
    "content_type": "chapter",
    "author_id": "author_456",
    "title": "Chapter 1: The Beginning"
})

registration = response.json()
print(f"Registration ID: {registration['registration_id']}")
print(f"Content Hash: {registration['content_hash']}")
```

### Generate Certificate
```python
response = requests.post("http://localhost:8004/api/ip/protection/certificate", json={
    "registration_id": registration['registration_id'],
    "author_name": "John Doe"
})

certificate = response.json()
print(f"Certificate Number: {certificate['certificate_number']}")
print(f"Certificate URL: {certificate['certificate_url']}")
```

## Additional API Endpoints

### Blockchain Integration
```
POST /api/ip/blockchain/register
GET /api/ip/blockchain/verify/{transaction_hash}
POST /api/ip/blockchain/plagiarism-check
GET /api/ip/blockchain/networks
GET /api/ip/blockchain/stats
```

### Licensing & Rights Management
```
POST /api/ip/licensing/agreement
GET /api/ip/licensing/templates
POST /api/ip/licensing/validate-terms
POST /api/ip/licensing/revenue-calculation
GET /api/ip/licensing/contract/{agreement_id}
POST /api/ip/licensing/marketplace/listing
GET /api/ip/licensing/marketplace/search
GET /api/ip/licensing/agreement/{agreement_id}/rights-summary
GET /api/ip/licensing/stats
```

## Complete Feature Set

The IP Protection Service now provides a comprehensive suite of tools for:

1. **Content Protection**: Cryptographic hashing, timestamping, and digital certificates
2. **Blockchain Verification**: Optional blockchain registration for enhanced proof
3. **Plagiarism Detection**: Forensic analysis tools for content originality verification
4. **Licensing Management**: Complete licensing workflow from agreement creation to revenue distribution
5. **Rights Tracking**: Clear ownership and permission management
6. **Marketplace Integration**: Platform for licensing opportunity discovery

## Legal Disclaimer

This service provides technical tools for content protection but does not constitute legal advice. Content creators should consult with qualified legal professionals regarding intellectual property matters.